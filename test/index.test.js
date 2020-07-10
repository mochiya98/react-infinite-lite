const puppeteer = require("puppeteer-core");
const chromePaths = require("chrome-paths");
const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const fileUrl = require("file-url");
const { cases, checkScrollPositions } = require("./fixtures/cases");
const Infinite = require("../dist/index");

function px2number(px) {
  if (!px.match(/^[0-9]+(?:\.[0-9]+)?px$/)) {
    throw new Error(`invalid pixel value: "${px}"`);
  }
  return parseFloat(px.slice(0, -2));
}

class InfiniteChecker {
  ecNodeIdsSet = new Set();
  onceIdleTimeout = 0;
  onceIdleCallbacks = [];
  page = null;

  onceIdle(cb) {
    this.onceIdleCallbacks.push(cb);
  }
  fireIdle() {
    for (const cb of this.onceIdleCallbacks) {
      cb();
    }
    this.onceIdleCallbacks = [];
  }

  async attatch(page) {
    this.page = page;
    await this.page.exposeFunction("onUpdateDOM", () => {
      clearTimeout(this.onceIdleTimeout);
      this.onceIdleTimeout = setTimeout(() => this.fireIdle(), 700);
    });
    await this.page.evaluate(() => {
      var observer = new MutationObserver((mutations) => {
        // eslint-disable-next-line no-undef
        onUpdateDOM();
      });
      observer.observe(document.body, {
        attributes: false,
        childList: true,
        subtree: true,
      });
    });
  }
  async waitIdle() {
    clearTimeout(this.onceIdleTimeout);
    this.onceIdleTimeout = setTimeout(() => this.fireIdle(), 700);
    await new Promise((resolve) => {
      this.onceIdle(resolve);
    });
    this.ecNodeIdsSet.clear();
    (
      await this.page.evaluate(() =>
        [...document.getElementsByClassName("ecnode")].map((c) => c.id)
      )
    ).map((id) => this.ecNodeIdsSet.add(id));
  }

  setVirtualizeTesterScrollTop(pos) {
    return this.page.evaluate((pos) => {
      [...document.getElementsByClassName("virtualize-test-wrapper")].forEach(
        (c) => {
          c.scrollTop = pos;
        }
      );
    }, pos);
  }
  setInfiniteLoadTesterScrollTop(pos) {
    return this.page.evaluate((pos) => {
      this.document.querySelector(
        ".ec-infinite-load-fire-test-wrapper"
      ).scrollTop = pos;
    }, pos);
  }

  getItemVisible(key, idx) {
    return this.ecNodeIdsSet.has(`ec-${key}-${idx}`);
  }

  getScrollHeight(envKey) {
    return this.page.evaluate(
      (envKey) =>
        document.querySelector(`.ec-${envKey}-wrapper>div`).scrollHeight,
      envKey
    );
  }
  getWrapperPaddings(envKey) {
    return this.page.evaluate((envKey) => {
      const { paddingTop, paddingBottom } = window.getComputedStyle(
        document.querySelector(`.ec-${envKey}-wrapper>div`)
      );
      return { paddingTop, paddingBottom };
    }, envKey);
  }

  getInfiniteLoadFired() {
    return this.page.evaluate(
      () =>
        document.querySelector(".infinite-load-fired").textContent === "true"
    );
  }
  getHandleScrollFired() {
    return this.page.evaluate(
      () =>
        document.querySelector(".handle-scroll-fired").textContent === "true"
    );
  }
}

describe("puppeteer testing", function () {
  this.timeout(0);
  let browser, page, infiniteChecker;
  before(async function () {
    browser = await puppeteer.launch({
      executablePath: chromePaths.chrome,
      headless: true,
      args: [
        "--guest",
        "--no-sandbox",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        "--disable-translate",
        "--enable-features=NetworkService,NetworkServiceInProcess",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
      ],
      defaultViewport: {
        width: 800,
        height: 900,
      },
      devtools: false,
    });
    page = await browser.newPage();
    await page.goto(fileUrl(path.join(__dirname, "fixtures/view.html")), {
      waitUntil: "networkidle2",
    });
    infiniteChecker = new InfiniteChecker();
    await infiniteChecker.attatch(page);
    await infiniteChecker.waitIdle();
  });
  after(async function () {
    await browser.close();
  });

  describe("infinite loading", function () {
    describe("check spinner", function () {
      it("hidden when idle", async function () {
        const spinner = await page.$(".ec-spinner-test-idle-wrapper .spinner");
        expect(spinner).to.be.null;
      });
      it("visible when loading", async function () {
        const spinner = await page.$(
          ".ec-spinner-test-loading-wrapper .spinner"
        );
        expect(spinner).to.be.ok;
      });
    });
    describe("check load event", function () {
      it("not fired at first", async function () {
        expect(await infiniteChecker.getInfiniteLoadFired()).to.be.false;
        expect(await infiniteChecker.getHandleScrollFired()).to.be.false;
      });
      // infinite-load-fire-test
      it("not fired at scrollTop=299", async function () {
        await infiniteChecker.setInfiniteLoadTesterScrollTop(299);
        await infiniteChecker.waitIdle();
        expect(await infiniteChecker.getInfiniteLoadFired()).to.be.false;
        expect(infiniteChecker.getItemVisible("infinite-load-fire-test", 1)).to
          .be.false;
        expect(await infiniteChecker.getHandleScrollFired()).to.be.true;
      });
      it("fired at scrollTop=300", async function () {
        await infiniteChecker.setInfiniteLoadTesterScrollTop(300);
        await infiniteChecker.waitIdle();
        expect(await infiniteChecker.getInfiniteLoadFired()).to.be.true;
        expect(infiniteChecker.getItemVisible("infinite-load-fire-test", 1)).to
          .be.true;
      });
    });
  });
  for (const pos of checkScrollPositions) {
    describe(`at${pos}`, function () {
      before(async function () {
        await infiniteChecker.setVirtualizeTesterScrollTop(pos);
        await infiniteChecker.waitIdle();
      });
      describe("check visibility", function () {
        for (const {
          envName,
          envKey,
          [`at${pos}`]: {
            visibleRange: [from, to],
          },
        } of cases) {
          it(envName, async function () {
            expect(
              infiniteChecker.getItemVisible(envKey, from - 1),
              `${envKey}[${from - 1}] must not visible`
            ).to.be.false;
            expect(
              infiniteChecker.getItemVisible(envKey, from),
              `${envKey}[${from}] must visible`
            ).to.be.true;
            expect(
              infiniteChecker.getItemVisible(envKey, to),
              `${envKey}[${to}] must visible`
            ).to.be.true;
            expect(
              infiniteChecker.getItemVisible(envKey, to + 1),
              `${envKey}[${to + 1}] must not visible`
            ).to.be.false;
          });
        }
      });
      describe("check paddings", async function () {
        for (const {
          envName,
          envKey,
          [`at${pos}`]: {
            paddings: [expectedPaddingTop, expectedPaddingBottom],
          },
        } of cases) {
          it(envName, async function () {
            const {
              paddingTop,
              paddingBottom,
            } = await infiniteChecker.getWrapperPaddings(envKey);
            expect(px2number(paddingTop)).to.equal(expectedPaddingTop);
            expect(px2number(paddingBottom)).to.equal(expectedPaddingBottom);
          });
        }
      });
      describe("check scrollHeight", function () {
        for (const { envName, envKey } of cases) {
          it(envName, async function () {
            const scrollHeight = await infiniteChecker.getScrollHeight(envKey);
            expect(scrollHeight).to.equal(6560);
          });
        }
      });
    });
  }
});
describe("Infinite.containerHeightScaleFactor", function () {
  it("should return valid scaleFactor object", () => {
    for (let i = 0; i < 3; i++) {
      const n = 1 + Math.random() * 2;
      expect(Infinite.containerHeightScaleFactor(n)).to.deep.equal({
        type: "chsf",
        amount: n,
      });
    }
  });
});
