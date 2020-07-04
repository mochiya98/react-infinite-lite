const puppeteer = require("puppeteer-core");
const chromePaths = require("chrome-paths");
const chai = require("chai");
const expect = chai.expect;
const path = require("path");
const fileUrl = require("file-url");
const { cases } = require("./fixtures/cases");
const Infinite = require("../dist/index");

class InfiniteChecker {
  ecNodeIdsSet = new Set();
  onIdleTimeout = 0;
  onIdleCallbacks = [];
  page = null;
  onIdle(cb) {
    this.onIdleCallbacks.push(cb);
  }

  fireIdle() {
    for (const cb of this.onIdleCallbacks) {
      cb();
    }
    this.onIdleCallbacks = [];
  }

  async attatch(page) {
    this.page = page;
    await this.page.exposeFunction("onUpdateDOM", () => {
      clearTimeout(this.onIdleTimeout);
      this.onIdleTimeout = setTimeout(() => this.fireIdle(), 700);
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
    clearTimeout(this.onIdleTimeout);
    this.onIdleTimeout = setTimeout(() => this.fireIdle(), 700);
    await new Promise((resolve) => {
      this.onIdle(resolve);
    });
    this.ecNodeIdsSet.clear();
    (
      await this.page.evaluate(() =>
        [...document.getElementsByClassName("ecnode")].map((c) => c.id)
      )
    ).map((id) => this.ecNodeIdsSet.add(id));
  }

  isVisible(key, idx) {
    return this.ecNodeIdsSet.has(`ec-${key}-${idx}`);
  }

  assertRangeVisible(key, startIdx, endIdx) {
    expect(
      this.isVisible(key, startIdx - 1),
      `${key}[${startIdx - 1}] must not visible`
    ).to.be.false;
    expect(this.isVisible(key, startIdx), `${key}[${startIdx}] must visible`).to
      .be.true;
    expect(this.isVisible(key, endIdx), `${key}[${endIdx}] must visible`).to.be
      .true;
    expect(
      this.isVisible(key, endIdx + 1),
      `${key}[${endIdx + 1}] must not visible`
    ).to.be.false;
  }
}

describe("puppeteer testing", function () {
  // mochaのタイムアウトを無しに設定する（defalut:2000ms.
  this.timeout(0);
  let browser, page, infiniteChecker;
  // テスト実行前処理.
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
        expect(
          await page.evaluate(
            () =>
              !!document.querySelector(".ec-spinner-test-idle-wrapper .spinner")
          )
        ).to.be.false;
      });
      it("visible when loading", async function () {
        expect(
          await page.evaluate(
            () =>
              !!document.querySelector(
                ".ec-spinner-test-loading-wrapper .spinner"
              )
          )
        ).to.be.true;
      });
    });
    describe("check load event", function () {
      const getInfiniteLoadFired = () =>
        page.evaluate(
          () =>
            document.querySelector(".infinite-load-fired").textContent ===
            "true"
        );
      const getHandleScrollFired = () =>
        page.evaluate(
          () =>
            document.querySelector(".handle-scroll-fired").textContent ===
            "true"
        );
      it("not fired at first", async function () {
        expect(await getInfiniteLoadFired()).to.be.false;
        expect(await getHandleScrollFired()).to.be.false;
      });
      // infinite-load-fire-test
      it("not fired at scrollTop=299", async function () {
        await page.evaluate(() => {
          document.querySelector(
            ".ec-infinite-load-fire-test-wrapper"
          ).scrollTop = 299;
        });
        await infiniteChecker.waitIdle();
        expect(await getInfiniteLoadFired()).to.be.false;
        expect(infiniteChecker.isVisible("infinite-load-fire-test", 1)).to.be
          .false;
        expect(await getHandleScrollFired()).to.be.true;
      });
      it("fired at scrollTop=300", async function () {
        await page.evaluate(() => {
          document.querySelector(
            ".ec-infinite-load-fire-test-wrapper"
          ).scrollTop = 300;
        });
        await infiniteChecker.waitIdle();
        expect(await getInfiniteLoadFired()).to.be.true;
        expect(infiniteChecker.isVisible("infinite-load-fire-test", 1)).to.be
          .true;
      });
    });
  });
  describe("atTop", function () {
    describe("check visibility", function () {
      for (const {
        envName,
        envKey,
        atTop: [from, to],
      } of cases) {
        it(envName, async function () {
          infiniteChecker.assertRangeVisible(envKey, from, to);
        });
      }
    });
    describe("check scrollHeights", function () {
      it("all scrollHeight must be 6560", async function () {
        const heights = await page.evaluate(() =>
          [...document.querySelectorAll("virtualize-test-wrapper>div")].map(
            (c) => c.scrollheight
          )
        );
        for (const height of heights) {
          expect(height).to.be(6560);
        }
      });
    });
  });
  describe("at500", function () {
    before(async function () {
      await page.evaluate(() => {
        [...document.getElementsByClassName("virtualize-test-wrapper")].forEach(
          (c) => {
            c.scrollTop = 500;
          }
        );
      });
      await infiniteChecker.waitIdle();
    });
    describe("check visibility", function () {
      for (const {
        envName,
        envKey,
        at500: [from, to],
      } of cases) {
        it(envName, async function () {
          infiniteChecker.assertRangeVisible(envKey, from, to);
        });
      }
    });
    describe("check scrollHeights", function () {
      it("all scrollHeight must be 6560", async function () {
        const heights = await page.evaluate(() =>
          [...document.querySelectorAll("virtualize-test-wrapper>div")].map(
            (c) => c.scrollheight
          )
        );
        for (const height of heights) {
          expect(height).to.be(6560);
        }
      });
    });
  });
  describe("at3000", function () {
    before(async function () {
      await page.evaluate(() => {
        [...document.getElementsByClassName("virtualize-test-wrapper")].forEach(
          (c) => {
            c.scrollTop = 3000;
          }
        );
      });
      await infiniteChecker.waitIdle();
    });
    describe("check visibility", function () {
      for (const {
        envName,
        envKey,
        at3000: [from, to],
      } of cases) {
        it(envName, async function () {
          infiniteChecker.assertRangeVisible(envKey, from, to);
        });
      }
    });
    describe("check scrollHeights", function () {
      it("all scrollHeight must be 6560", async function () {
        const heights = await page.evaluate(() =>
          [...document.querySelectorAll("virtualize-test-wrapper>div")].map(
            (c) => c.scrollheight
          )
        );
        for (const height of heights) {
          expect(height).to.be(6560);
        }
      });
    });
  });
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
