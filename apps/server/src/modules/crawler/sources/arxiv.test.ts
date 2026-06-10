import { expect, test, describe, mock, spyOn } from "bun:test";
import { arxivAdapter } from "./arxiv";

const MOCK_ARXIV_XML = `
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <ListRecords>
    <record>
      <header>
        <identifier>oai:arXiv.org:2101.00001</identifier>
        <datestamp>2021-01-01</datestamp>
      </header>
      <metadata>
        <arXiv xmlns="http://arxiv.org/OAI/arXiv/">
          <id>2101.00001</id>
          <created>2021-01-01</created>
          <authors>
            <author>
              <keyname>Doe</keyname>
              <forenames>John</forenames>
            </author>
            <author>
              <keyname>Smith</keyname>
              <forenames>Jane</forenames>
            </author>
          </authors>
          <title>Test Paper Title</title>
          <categories>cs.LG cs.AI</categories>
          <abstract>This is a test abstract for the paper.</abstract>
          <doi>10.1234/test.doi</doi>
        </arXiv>
      </metadata>
    </record>
  </ListRecords>
</OAI-PMH>
`;

describe("ArXiv Adapter", () => {
  test("correctly parses ArXiv OAI-PMH XML", async () => {
    // Mock the global fetch
    global.fetch = mock(() => Promise.resolve(new Response(MOCK_ARXIV_XML)));

    const options = { maxRecords: 1 };
    const generator = arxivAdapter.crawl(options);
    
    const { value: batch } = await generator.next();
    
    expect(batch).toBeDefined();
    expect(batch!.length).toBe(1);
    
    const paper = batch![0];
    expect(paper.source_id).toBe("2101.00001");
    expect(paper.title).toBe("Test Paper Title");
    expect(paper.authors).toEqual(["John Doe", "Jane Smith"]);
    expect(paper.keywords).toEqual(["cs.LG", "cs.AI"]);
    expect(paper.doi).toBe("10.1234/test.doi");
    expect(paper.source_url).toBe("https://arxiv.org/abs/2101.00001");
  });

  test("handles empty records", async () => {
    const EMPTY_XML = `<OAI-PMH><ListRecords></ListRecords></OAI-PMH>`;
    global.fetch = mock(() => Promise.resolve(new Response(EMPTY_XML)));

    const generator = arxivAdapter.crawl({ maxRecords: 1 });
    const { done } = await generator.next();
    expect(done).toBe(true);
  });

  test("filters by subcategory correctly", async () => {
    global.fetch = mock(() => Promise.resolve(new Response(MOCK_ARXIV_XML)));

    // Request a different subcategory than what's in MOCK_ARXIV_XML
    const options = { categories: ["math.GT"], maxRecords: 1 };
    const generator = arxivAdapter.crawl(options);
    
    const { done } = await generator.next();
    // Should be done because no records matched the subcategory
    expect(done).toBe(true);
  });

  test("handles ArXiv 503 Retry-After response", async () => {
    let callCount = 0;
    global.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(new Response("Service Unavailable", { 
          status: 503, 
          headers: { "Retry-After": "0" } 
        }));
      }
      return Promise.resolve(new Response(MOCK_ARXIV_XML));
    });

    const generator = arxivAdapter.crawl({ maxRecords: 1 });
    const { value: batch } = await generator.next();
    
    expect(callCount).toBe(2);
    expect(batch!.length).toBe(1);
  });

  test("handles ArXiv fetch failure with retry", async () => {
    let callCount = 0;
    global.fetch = mock(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error("Network failure"));
      }
      return Promise.resolve(new Response(MOCK_ARXIV_XML));
    });

    const generator = arxivAdapter.crawl({ maxRecords: 1 });
    const { value: batch } = await generator.next();
    
    expect(callCount).toBe(2);
    expect(batch!.length).toBe(1);
  });
});
