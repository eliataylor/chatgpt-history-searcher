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
            let nextThreads = await this.extractLinks();
            while (nextThreads.length > 0) {
                this.allThreads = this.allThreads.concat(nextThreads);
                if (this.waitTime === 0) {
                    nextThreads = []
                } else {
                    this.scrollDown();
                    nextThreads = await this.extractLinks();
                    nextThreads = nextThreads.filter(a => !this.allThreads.find(a2 => a.link === a2.link)); // TODO loop in reverse
                    await this.wait(this.waitTime);
                }
            }

            console.log("LINKS ONLY", this.allThreads);

            if (this.token) {
                await this.loadAllThreadDetails(this.allThreads);
                console.log("LINKS WITH DETAILS", this.allThreads);
            } else {
                console.log("cannot load details without an Auth token");
            }

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
        console.log(`CONTAINER height: ${container.offsetHeight} vs scrollable ${container.scrollHeight}`)
        container.scrollTo(0, container.scrollHeight);
        // container.scrollIntoView({ behavior: "smooth", block: "end" });
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

// set last param to 0 to NOT auto scroll
const linkScraper = new LinkScraper('.scrollbar-trigger .overflow-y-auto', 'nav a', 1500);
linkScraper.scrapeLinks();
