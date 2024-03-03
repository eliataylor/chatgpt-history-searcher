class LinkScraper {
    constructor(containerSelector, linkSelector, waitTime) {
        this.containerSelector = containerSelector;
        this.linkSelector = linkSelector;
        this.waitTime = waitTime;
        this.allThreads = [];
        this.token = false;
    }

    async scrapeLinks() {
        try {
            this.allThreads = await this.extractLinks();
            while (await this.scrollDown()) {
                const nextThreads = await this.extractLinks();
                const newThreads = nextThreads.filter(a => !this.allThreads.find(a2 => a.link === a2.link))
                if (newThreads.length > 0) {
                    this.allThreads = this.allThreads.concat(newThreads);
                    await this.wait(this.waitTime);
                }
            }

            console.log("LINKS ONLY", this.allThreads);

            await this.loadAllThreadDetails(this.allThreads);

            console.log("LINKS WITH DETAILS", this.allThreads);
        } catch (error) {
            console.error("Error:", error);
        }
    }

    async extractLinks() {
        const linkElements = document.querySelectorAll(this.linkSelector);
        const threads = Array.from(linkElements).map((link, index) => ({
            index: index + 1,
            title: link.innerText,
            link: link.href
        }));
        return threads;
    }

    async scrollDown() {
        const container = document.querySelector(this.containerSelector);
        const beforeScrollHeight = container.scrollHeight;
        window.scrollTo(0, container.scrollHeight);
        await this.wait(this.waitTime);
        const afterScrollHeight = container.scrollHeight;
        return beforeScrollHeight !== afterScrollHeight;
    }

    async wait(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }


    async fetchLinkDetails(link) {
        if (!link) return 'invalid link ' + link;
        const uuid = link.substring(link.lastIndexOf('/') + 1);
        if (!uuid || uuid.length !== 36) return 'invalid uuid ' + link;

        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };
        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }
        let response = await fetch('https://chat.openai.com/backend-api/conversation/' + uuid, options);

        if (!response.ok) {
            return `HTTP error! Status: ${response.status}`;
        }

        response = await response.json();

        const prompt_responses = [];
        for (let pid in response.mapping) {
            if (response.mapping[pid].message && response.mapping[pid].message.content && response.mapping[pid].message.content.length > 0  && response.mapping[pid].message.content[0].length > 0) {
                let resp = {
                    author: response.mapping[pid].message.author.role,
                    content: response.mapping[pid].message.content.parts.join(' '),
                }
                prompt_responses.push(resp);
            }
        }

        return prompt_responses;
    }


    async loadAllThreadDetails(threads) {
        for(let i=0; i < threads.length; i++) {
            const thread = threads[i];
            let details = await this.fetchLinkDetails(thread.link);
            if (Array.isArray(details)) {
                threads[i].details = details;
            }
        }
        return threads;
    }

}

const linkScraper = new LinkScraper('.scrollbar-trigger', 'nav a', 1500);
linkScraper.scrapeLinks();
