class LinkScraper {
    constructor(containerSelector, scrollToBottom = true) {
        this.containerSelector = containerSelector;
        this.scrollToBottom = scrollToBottom;
        this.allLinks = [];
    }

    async scrapeLinks() {
        const container = document.querySelector(this.containerSelector);
        if (!container) {
            console.error(`Container with selector "${this.containerSelector}" not found.`);
            return;
        }

        const initialLinks = this.parseLinks(container);
        this.allLinks.push(...initialLinks);

        if (this.scrollToBottom) {
            container.scrollIntoView({ behavior: "smooth", block: "end" });
        }

        await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait 1500ms

        const newLinks = this.parseLinks(container);
        const foundNewLinks = newLinks.filter((link) => !this.allLinks.some((l) => l.href === link.href));

        if (foundNewLinks.length > 0) {
            console.log("New Links:");
            console.log(JSON.stringify(foundNewLinks));
            this.allLinks.push(...foundNewLinks);
        }

        console.log("All Links:");
        console.log(JSON.stringify(this.allLinks));
    }

    parseLinks(container) {
        const links = container.querySelectorAll("a");
        const parsedLinks = [];

        for (const link of links) {
            const href = link.getAttribute("href");
            const title = link.textContent.trim();

            if (href) {
                parsedLinks.push({ href, title });
            }
        }

        return parsedLinks;
    }
}

// Example usage
const scraper = new LinkScraper(".article-container", false); // Don't scroll in this example
scraper.scrapeLinks();
