// @vitest-environment jsdom
/**
 * Safe Highlight XSS Protection Tests
 *
 * Adversarial tests to ensure the safe highlighting utility
 * properly protects against XSS attacks.
 */

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { safeHighlight, SafeHighlightedText } from "../safe-highlight";

describe("safeHighlight XSS Protection", () => {
  // Helper to render highlight result to HTML string for inspection
  const renderHighlight = (
    text: string | null | undefined,
    terms: string | string[] | null | undefined
  ): string => {
    const result = safeHighlight(text, terms);
    if (!result) return "";
    return renderToStaticMarkup(<span>{result}</span>);
  };

  describe("Script injection attempts", () => {
    it("escapes <script> tags in text content", () => {
      const malicious = '<script>alert("XSS")</script>';
      const result = renderHighlight(malicious, "alert");

      // Should contain escaped HTML entities, not actual script tags
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
      // The text should be escaped as entities
      expect(result).toContain("&lt;script&gt;");
    });

    it("escapes <script> tags when they match the search term", () => {
      const malicious = '<script>alert(1)</script>';
      const result = renderHighlight(malicious, "script");

      expect(result).not.toContain("<script>");
      // Should highlight "script" within the escaped text
      expect(result).toContain("<mark");
      expect(result).toContain("&lt;");
    });

    it("escapes inline event handlers", () => {
      const malicious = '<img src=x onerror=alert(1)>';
      const result = renderHighlight(malicious, "img");

      // The key is that < and > are escaped, making this plain text not HTML
      expect(result).not.toContain("<img");
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
    });

    it("escapes javascript: protocol URLs", () => {
      const malicious = '<a href="javascript:alert(1)">click</a>';
      const result = renderHighlight(malicious, "click");

      // The key is that < and > are escaped, making this plain text not HTML
      expect(result).not.toContain("<a href");
      expect(result).toContain("&lt;a href=");
    });
  });

  describe("Event handler injection attempts", () => {
    it("escapes onload handlers", () => {
      const malicious = '<body onload=alert(1)>';
      const result = renderHighlight(malicious, "body");

      // Key: < and > are escaped so no actual HTML element is created
      expect(result).not.toContain("<body");
      expect(result).toContain("&lt;");
    });

    it("escapes onclick handlers", () => {
      const malicious = '<div onclick="alert(1)">test</div>';
      const result = renderHighlight(malicious, "test");

      // Key: < and > are escaped so no actual HTML element is created
      expect(result).not.toContain("<div onclick");
      expect(result).toContain("&lt;div onclick");
    });

    it("escapes onfocus handlers", () => {
      const malicious = '<input onfocus=alert(1) autofocus>';
      const result = renderHighlight(malicious, "input");

      // Key: < and > are escaped so no actual HTML element is created
      expect(result).not.toContain("<input onfocus");
      expect(result).toContain("&lt;");
    });

    it("escapes onmouseover handlers", () => {
      const malicious = '<span onmouseover="alert(1)">hover me</span>';
      const result = renderHighlight(malicious, "hover");

      // Key: < and > are escaped so no actual HTML element is created
      expect(result).not.toContain("<span onmouseover");
      expect(result).toContain("&lt;span onmouseover");
    });
  });

  describe("Encoded markup attacks", () => {
    it("handles HTML entity encoded script tags", () => {
      // If someone tries to use HTML entities in the source data
      const malicious = "&lt;script&gt;alert(1)&lt;/script&gt;";
      const result = renderHighlight(malicious, "alert");

      // Should double-escape - entities become &amp;lt; etc.
      expect(result).not.toContain("<script>");
      expect(result).toContain("&amp;lt;script&amp;gt;");
    });

    it("handles URL-encoded script tags", () => {
      const malicious = "%3Cscript%3Ealert(1)%3C/script%3E";
      const result = renderHighlight(malicious, "script");

      // URL encoding should be preserved as plain text
      expect(result).toContain("%3C");
      expect(result).not.toContain("<script>");
    });

    it("handles Unicode escape sequences", () => {
      const malicious = "\\u003cscript\\u003ealert(1)\\u003c/script\\u003e";
      const result = renderHighlight(malicious, "script");

      // Unicode escapes should be preserved as plain text
      expect(result).toContain("\\u003c");
      expect(result).not.toContain("<script>");
    });

    it("handles mixed encoding attempts", () => {
      const malicious = '<scr&#x69;pt>alert(1)</script>';
      const result = renderHighlight(malicious, "alert");

      expect(result).not.toContain("<scr");
      expect(result).toContain("&lt;scr");
    });
  });

  describe("Regex character injection (ReDoS prevention)", () => {
    it("escapes regex special characters in search terms", () => {
      const text = "Price is $100.00 (USD)";
      const searchTerm = "$100.00";
      const result = renderHighlight(text, searchTerm);

      // Should find and highlight the exact text without regex errors
      expect(result).toContain("<mark");
      expect(result).toContain("$100.00");
    });

    it("handles search terms with all regex metacharacters", () => {
      const text = "Test [brackets] and (parens) with .* wildcards";
      const searchTerm = "[brackets]";
      const result = renderHighlight(text, searchTerm);

      expect(result).toContain("<mark");
    });

    it("handles catastrophic backtracking patterns in search terms", () => {
      const text = "aaaaaaaaaaaaaaaaaaaaaaaab";
      // This pattern could cause catastrophic backtracking if not escaped
      const searchTerm = "(a+)+b";
      const result = renderHighlight(text, searchTerm);

      // Should complete without hanging and NOT match (it's literal text)
      expect(result).not.toContain("<mark");
    });

    it("handles pipe characters (regex OR) in search terms", () => {
      const text = "Choose red|blue|green colors";
      const searchTerm = "red|blue";
      const result = renderHighlight(text, searchTerm);

      // Should match literal "red|blue" not "red" OR "blue"
      expect(result).toContain("<mark");
    });
  });

  describe("Empty and edge case inputs", () => {
    it("returns null for null text", () => {
      const result = safeHighlight(null, "test");
      expect(result).toBeNull();
    });

    it("returns null for undefined text", () => {
      const result = safeHighlight(undefined, "test");
      expect(result).toBeNull();
    });

    it("returns plain text for empty search term", () => {
      const result = safeHighlight("Hello world", "");
      expect(result).toEqual(["Hello world"]);
    });

    it("returns plain text for null search term", () => {
      const result = safeHighlight("Hello world", null);
      expect(result).toEqual(["Hello world"]);
    });

    it("returns plain text for whitespace-only search term", () => {
      const result = safeHighlight("Hello world", "   ");
      expect(result).toEqual(["Hello world"]);
    });

    it("handles empty string text", () => {
      const result = safeHighlight("", "test");
      expect(result).toBeNull();
    });

    it("handles array of empty search terms", () => {
      const result = safeHighlight("Hello world", ["", "  ", null as unknown as string]);
      expect(result).toEqual(["Hello world"]);
    });
  });

  describe("Normal highlighting functionality", () => {
    it("highlights single term correctly", () => {
      const result = safeHighlight("Hello world", "world");
      expect(result).toHaveLength(2);
      expect(result![0]).toBe("Hello ");
      expect(React.isValidElement(result![1])).toBe(true);
    });

    it("highlights multiple terms", () => {
      const result = safeHighlight("Hello beautiful world", ["hello", "world"]);

      const html = renderHighlight("Hello beautiful world", ["hello", "world"]);
      expect(html).toContain("<mark");
      // Should have two marks
      expect(html.match(/<mark/g)?.length).toBe(2);
    });

    it("highlights case-insensitively by default", () => {
      const result = safeHighlight("HELLO World hello", "hello");

      const html = renderHighlight("HELLO World hello", "hello");
      expect(html.match(/<mark/g)?.length).toBe(2);
    });

    it("handles overlapping matches correctly", () => {
      const result = safeHighlight("depression depressive", ["depress"]);

      const html = renderHighlight("depression depressive", ["depress"]);
      expect(html.match(/<mark/g)?.length).toBe(2);
    });
  });

  describe("SafeHighlightedText component", () => {
    it("renders with custom className", () => {
      const html = renderToStaticMarkup(
        <SafeHighlightedText
          text="Hello world"
          searchTerms="world"
          className="custom-class"
        />
      );

      expect(html).toContain('class="custom-class"');
      expect(html).toContain("<mark");
    });

    it("returns null for null text", () => {
      const result = <SafeHighlightedText text={null} searchTerms="test" />;
      const html = renderToStaticMarkup(result);

      expect(html).toBe("");
    });

    it("prevents XSS in component usage", () => {
      const html = renderToStaticMarkup(
        <SafeHighlightedText
          text='<img src=x onerror=alert("XSS")>'
          searchTerms="img"
        />
      );

      // Key: no actual <img> tag is created
      expect(html).not.toContain("<img src");
      expect(html).toContain("&lt;");
    });
  });

  describe("SVG and XML injection", () => {
    it("escapes SVG onload handlers", () => {
      const malicious = '<svg onload=alert(1)>';
      const result = renderHighlight(malicious, "svg");

      // Key: no actual <svg> element is created
      // The < and > are escaped to &lt; and &gt;
      expect(result).not.toMatch(/<svg onload/);
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
    });

    it("escapes SVG script elements", () => {
      const malicious = '<svg><script>alert(1)</script></svg>';
      const result = renderHighlight(malicious, "alert");

      // Key: no actual HTML elements are created
      expect(result).not.toMatch(/<svg>[^&]/);
      expect(result).not.toMatch(/<script>[^&]/);
      expect(result).toContain("&lt;svg&gt;");
    });

    it("escapes XML processing instructions", () => {
      const malicious = '<?xml version="1.0"?><script>alert(1)</script>';
      const result = renderHighlight(malicious, "xml");

      // Key: no actual XML/HTML is rendered
      expect(result).not.toMatch(/<\?xml[^&]/);
      expect(result).toContain("&lt;?");
    });
  });

  describe("Template literal and expression injection", () => {
    it("handles template literal syntax", () => {
      const malicious = "${alert(1)}";
      const result = renderHighlight(malicious, "alert");

      // Should treat as plain text - $ is not executed
      expect(result).toContain("<mark");
      // Render to check output contains the literal text
      const html = renderHighlight("${alert(1)}", "alert");
      expect(html).toContain("$");
    });

    it("handles JSX-like expressions", () => {
      const malicious = "{() => alert(1)}";
      const result = renderHighlight(malicious, "alert");

      // Should treat as plain text - the curly braces are rendered as text
      // Check that alert is highlighted
      expect(result).toContain("<mark");
    });
  });

  describe("Data URL injection", () => {
    it("escapes data URL with JavaScript", () => {
      const malicious = '<a href="data:text/html,<script>alert(1)</script>">click</a>';
      const result = renderHighlight(malicious, "click");

      expect(result).not.toContain("<a href=");
      expect(result).toContain("&lt;a href=");
    });

    it("escapes base64 encoded data URLs", () => {
      const malicious =
        '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">';
      const result = renderHighlight(malicious, "img");

      expect(result).not.toContain("<img src=");
    });
  });

  describe("CSS injection attempts", () => {
    it("escapes style tags", () => {
      const malicious = '<style>body { background: url("javascript:alert(1)"); }</style>';
      const result = renderHighlight(malicious, "style");

      // Key: no actual <style> element is created
      expect(result).not.toMatch(/<style>[^&]/);
      expect(result).toContain("&lt;");
    });

    it("escapes inline style with expression", () => {
      const malicious = '<div style="background:url(javascript:alert(1))">test</div>';
      const result = renderHighlight(malicious, "test");

      // Key: no actual <div> element is created
      expect(result).not.toMatch(/<div style=[^&]/);
      expect(result).toContain("&lt;div");
    });
  });
});
