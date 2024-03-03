class LinkScraper {
    constructor(containerSelector, linkSelector, waitTime) {
        this.containerSelector = containerSelector;
        this.linkSelector = linkSelector;
        this.waitTime = waitTime;
    }

    async scrapeLinks() {
        try {
            let threads = await this.extractLinks();
            while (await this.scrollDown()) {
                const additionalThreads = await this.extractLinks();
                threads = threads.concat(additionalThreads);
                await this.wait(this.waitTime);
            }

            // Request additional information for each link
            const threadsWithDetails = await this.requestLinkDetails(threads);
            this.printResults(threadsWithDetails);
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

    async requestLinkDetails(threads) {
        const requests = threads.map(thread => this.fetchLinkDetails(thread.link));

        // Wait for all requests to complete
        const responses = await Promise.all(requests);

        // Append the response's `messages` and `created` properties to each thread
        const threadsWithDetails = threads.map((thread, index) => ({
            ...thread,
            messages: responses[index].messages,
            created: responses[index].created
        }));

        return threadsWithDetails;
    }

    async fetchLinkDetails(link) {
        // Simulate an Ajax request (replace this with your actual API endpoint)
        const response = await $.ajax({
            url: 'https://jsonplaceholder.typicode.com/posts/1', // Example URL
            method: 'GET'
        });

        return {
            messages: response.title, // Example: use the 'title' property from the response
            created: response.body // Example: use the 'body' property from the response
        };
    }

    async wait(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    printResults(threads) {
        console.log(JSON.stringify(threads, null, 2));
    }
}

// Example usage:
const linkScraper = new LinkScraper('body', 'a', 500);
linkScraper.scrapeLinks();
