import { GeminiFormattingService } from '../services/geminiFormatting.service';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Example function demonstrating how to use the GeminiFormattingService
 * This shows various output formats with proper source attribution and confidence levels
 */
async function runGeminiFormattingExample() {
  try {
    // Create an instance of the formatting service
    const formattingService = new GeminiFormattingService();
    
    // Example query and context
    const query = "What are the latest OSHA requirements for fall protection in residential construction?";
    const context = `
OSHA's fall protection standard requires that employers provide fall protection for workers on walking/working surfaces with unprotected edges that are 6 feet or more above a lower level. 

According to OSHA's Directive CPL 02-01-054 issued in 2015, residential construction employers must comply with 29 CFR 1926.501(b)(13). This regulation generally requires that workers engaged in residential construction six feet or more above lower levels must be protected by conventional fall protection (i.e., guardrail systems, safety net systems, or personal fall arrest systems).

In 2016, OSHA published updated guidelines that clarified fall protection requirements for specific residential construction activities. The update emphasized that personal fall arrest systems must be rigged to prevent workers from free falling more than 6 feet or contacting a lower level.

A recent 2023 update to OSHA's Fall Prevention Campaign website notes that employers must:
- Plan ahead to ensure the job is done safely
- Provide the right equipment including the right kind of ladders, scaffolds, and safety gear
- Train workers to use the equipment safely

The Bureau of Labor Statistics reported that falls remain the leading cause of death in construction, accounting for 351 of the 1,008 construction fatalities recorded in 2021.
    `;
    
    // Example 1: Get JSON formatted response with confidence levels
    console.log("Example 1: JSON response with confidence levels");
    const jsonResponse = await formattingService.analyzeComplianceInfo(
      context,
      query,
      {
        format: 'json',
        exportOptions: {
          includeMetadata: true,
          includeDisclaimer: true
        }
      }
    );
    
    // Save the JSON response to a file
    fs.writeFileSync(
      path.join(__dirname, 'example-json-response.json'),
      JSON.stringify(jsonResponse, null, 2)
    );
    console.log("JSON response saved to example-json-response.json");
    
    // Example 2: Get HTML formatted response
    console.log("\nExample 2: HTML response");
    const htmlResponse = await formattingService.analyzeComplianceInfo(
      context,
      query,
      {
        format: 'html',
        exportOptions: {
          includeConfidenceIndicators: true,
          includeSources: true
        }
      }
    );
    
    // Save the HTML response to a file
    fs.writeFileSync(
      path.join(__dirname, 'example-html-response.html'),
      htmlResponse
    );
    console.log("HTML response saved to example-html-response.html");
    
    // Example 3: Get Markdown formatted response
    console.log("\nExample 3: Markdown response");
    const markdownResponse = await formattingService.analyzeComplianceInfo(
      context,
      query,
      {
        format: 'markdown',
        exportOptions: {
          includeConfidenceIndicators: true
        }
      }
    );
    
    // Save the Markdown response to a file
    fs.writeFileSync(
      path.join(__dirname, 'example-markdown-response.md'),
      markdownResponse
    );
    console.log("Markdown response saved to example-markdown-response.md");
    
    // Example 4: Document analysis
    console.log("\nExample 4: Document analysis with source attribution");
    const documentText = `
OSHA Standard 1926.501 - Duty to have fall protection
(b)(13) Residential construction. Each employee engaged in residential construction activities 6 feet (1.8 m) or more above lower levels shall be protected by guardrail systems, safety net system, or personal fall arrest system unless another provision in paragraph (b) of this section provides for an alternative fall protection measure. Exception: When the employer can demonstrate that it is infeasible or creates a greater hazard to use these systems, the employer shall develop and implement a fall protection plan which meets the requirements of paragraph (k) of 1926.502.

Note: There is a presumption that it is feasible and will not create a greater hazard to implement at least one of the above-listed fall protection systems. Accordingly, the employer has the burden of establishing that it is appropriate to implement a fall protection plan which complies with 1926.502(k) for a particular workplace situation, in lieu of implementing any of those systems.

OSHA Directive CPL 02-01-054
Effective Date: October 1, 2015
Subject: Inspection and Citation Guidance for Residential Construction Work

Update 2023: All employers engaged in residential construction must now document their fall protection training program with written certification records. 
    `;
    
    const documentResponse = await formattingService.analyzeComplianceDocument(
      documentText,
      "What are the current fall protection requirements?",
      {
        format: 'json',
        exportOptions: {
          includeMetadata: true,
          includeConfidenceIndicators: true,
          includeSources: true
        }
      }
    );
    
    // Save the document analysis response to a file
    fs.writeFileSync(
      path.join(__dirname, 'example-document-analysis.json'),
      JSON.stringify(documentResponse, null, 2)
    );
    console.log("Document analysis saved to example-document-analysis.json");
    
    return {
      success: true,
      message: "All examples completed successfully"
    };
  } catch (error: unknown) {
    logger.error('Error running Gemini formatting examples:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Error: ${errorMessage}`
    };
  }
}

// Execute the example function
if (require.main === module) {
  runGeminiFormattingExample()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error in example:', error);
      process.exit(1);
    });
}

export { runGeminiFormattingExample }; 