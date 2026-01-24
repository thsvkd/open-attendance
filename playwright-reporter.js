/**
 * Custom Playwright Reporter
 * Readable and polished test result output
 */

import fs from "fs";
import path from "path";
import stripAnsi from "strip-ansi";

class CustomReporter {
  constructor(options) {
    this.options = options;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
    };
    this.startTime = Date.now();
    this.suites = new Map();
    this.currentSuite = null;
  }

  onBegin(config) {
    console.clear();
    console.log(
      "\n╔════════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                  🧪 E2E Test Suite Started                      ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════╝\n",
    );
    const baseURL = config.projects?.[0]?.use?.baseURL || "Unknown";
    console.log(`📍 Base URL: ${baseURL}`);
    console.log(`🔨 Workers: 1 (Serial mode for stable results)\n`);
  }

  onTestBegin(test) {
    const suiteName = test.parent.title;
    const testName = test.title;

    if (this.currentSuite !== suiteName) {
      this.currentSuite = suiteName;
      console.log(`\n📦 ${suiteName}`);
      console.log("─".repeat(70));
    }

    process.stdout.write(`  ⏳ ${testName}... `);
  }

  onTestEnd(test, result) {
    const status = result.status;
    const duration = result.duration;

    let emoji = "✅";
    let statusText = "PASSED";
    let color = "\x1b[32m"; // green

    if (status === "failed") {
      emoji = "❌";
      statusText = "FAILED";
      color = "\x1b[31m"; // red
    } else if (status === "skipped") {
      emoji = "⏭️ ";
      statusText = "SKIPPED";
      color = "\x1b[33m"; // yellow
    }

    const reset = "\x1b[0m";
    console.log(`${emoji} ${color}${statusText}${reset} (${duration}ms)`);

    if (result.status === "failed" && result.error) {
      console.log("\n" + "─".repeat(70));
      console.log("  ❌ Error Details:");
      console.log("─".repeat(70));

      const errorMessage = result.error.message || result.error.toString();
      const lines = errorMessage.split("\n");

      lines.forEach((line, index) => {
        const cleanLine = stripAnsi(line);
        if (index === 0) {
          console.log(`  ${color}${cleanLine}${reset}`);
        } else if (cleanLine.trim()) {
          console.log(`  ${cleanLine}`);
        }
      });

      console.log("─".repeat(70) + "\n");

      // Print stack trace if available
      if (result.error.stack) {
        const stackLines = result.error.stack.split("\n").slice(1, 5);
        stackLines.forEach((line) => {
          const cleanLine = stripAnsi(line).trim();
          if (cleanLine) {
            console.log(`  📌 ${cleanLine}`);
          }
        });
        console.log();
      }

      // Option to stop on the first failure
      if (process.env.STOP_ON_FAILURE === "true") {
        console.log(
          "\n⛔ Tests stopped due to failure (STOP_ON_FAILURE=true)\n",
        );
        process.exit(1);
      }
    }

    this.testResults.total++;
    if (status === "passed") this.testResults.passed++;
    else if (status === "failed") this.testResults.failed++;
    else if (status === "skipped") this.testResults.skipped++;

    this.testResults.tests.push({
      name: test.title,
      suite: test.parent.title,
      status,
      duration,
      error: result.error ? result.error.message : null,
    });
  }

  onEnd() {
    const totalTime = Date.now() - this.startTime;
    const passRate =
      this.testResults.total > 0
        ? ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
        : 0;

    console.log(
      "\n╔════════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                    📊 Test Results Summary                      ║",
    );
    console.log(
      "╚════════════════════════════════════════════════════════════════╝\n",
    );

    // Summary results
    const summary = [
      ["Total Tests", `${this.testResults.total}`],
      ["✅ Passed", `${this.testResults.passed}`],
      ["❌ Failed", `${this.testResults.failed}`],
      ["⏭️  Skipped", `${this.testResults.skipped}`],
      ["", ""],
      ["Pass Rate", `${passRate}%`],
      ["Duration", `${(totalTime / 1000).toFixed(2)}s`],
    ];

    const maxLabelWidth = 16;
    summary.forEach(([label, value]) => {
      if (label === "") {
        console.log();
      } else {
        const padding = " ".repeat(Math.max(0, maxLabelWidth - label.length));
        if (label.includes("Pass Rate") && passRate === "100") {
          console.log(`  ${label}${padding} 🎉 ${value}`);
        } else if (label.includes("Failed") && this.testResults.failed > 0) {
          console.log(`  ${label}${padding} ❌ ${value}`);
        } else {
          console.log(`  ${label}${padding} ${value}`);
        }
      }
    });

    // Failed tests list
    if (this.testResults.failed > 0) {
      console.log("\n─".repeat(70));
      console.log("  🔍 Failed Tests:");
      console.log("─".repeat(70));

      const failedTests = this.testResults.tests.filter(
        (t) => t.status === "failed",
      );
      failedTests.forEach((test) => {
        console.log(`  ❌ [${test.suite}] ${test.name}`);
        if (test.error) {
          const errorPreview = test.error.split("\n")[0].substring(0, 60);
          console.log(`     └─ ${errorPreview}...`);
        }
      });
    }

    // Final status
    console.log("\n" + "─".repeat(70));
    if (this.testResults.failed === 0) {
      console.log("  ✨ All tests passed! Great job! 🎉\n");
    } else {
      console.log(
        `  ⚠️  ${this.testResults.failed} test(s) failed. Please review above.\n`,
      );
    }

    // HTML report path
    const reportPath = path.join(
      process.cwd(),
      "playwright-report",
      "index.html",
    );
    if (fs.existsSync(reportPath)) {
      console.log(`📄 Detailed report: playwright-report/index.html`);
    }
    console.log();
  }
}

module.exports = CustomReporter;
