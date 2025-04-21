import { Router } from 'express';
import { perplexityController } from '../controllers/perplexity.controller';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/perplexity/search:
 *   post:
 *     summary: Search for compliance information using Perplexity Sonar API
 *     description: Uses Perplexity Sonar API to search for real-time compliance information from government and news sources
 *     tags:
 *       - Perplexity
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: The search query
 *               focus:
 *                 type: string
 *                 enum: [government, news, all]
 *                 default: all
 *                 description: Focus area for search results
 *               maxResults:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 description: Maximum number of results to return
 *               timeoutMs:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 30000
 *                 description: Timeout in milliseconds
 *     responses:
 *       200:
 *         description: Successful search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - API key is missing or invalid
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post('/search', rateLimiter('perplexity', 5, 60), perplexityController.searchCompliance);

/**
 * @swagger
 * /api/perplexity/compliance-search:
 *   post:
 *     summary: Search for compliance information with enhanced government source prioritization
 *     description: Uses Perplexity Sonar API to search for real-time compliance information with advanced ranking that prioritizes government sources
 *     tags:
 *       - Perplexity
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: The search query
 *               domainCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [government, news, educational, organization, legal, other]
 *                 description: Filter results to specific domain categories
 *               governmentSourcesOnly:
 *                 type: boolean
 *                 default: false
 *                 description: Return only government sources
 *               maxResults:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 15
 *                 description: Maximum number of results to return
 *               minAuthorityScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Minimum domain authority score required
 *     responses:
 *       200:
 *         description: Successful search with prioritized government sources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - API key is missing or invalid
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post('/compliance-search', rateLimiter('perplexity', 3, 60), perplexityController.complianceSearch);

/**
 * @swagger
 * /api/perplexity/optimized-search:
 *   post:
 *     summary: Search with optimized queries based on user prompts
 *     description: Generates optimized search queries for Perplexity Sonar API based on user prompts and context
 *     tags:
 *       - Perplexity
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userPrompt
 *             properties:
 *               userPrompt:
 *                 type: string
 *                 description: The user's original prompt or question
 *               industry:
 *                 type: string
 *                 default: construction
 *                 description: Industry context for the search
 *               location:
 *                 type: string
 *                 description: Geographic location for regulatory context
 *               documentContext:
 *                 type: string
 *                 description: Context extracted from uploaded documents
 *               complianceDomains:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific compliance domains to focus on
 *               prioritizeRecent:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to prioritize recent information
 *               maxResults:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 description: Maximum number of results to return
 *               timeoutMs:
 *                 type: integer
 *                 minimum: 1000
 *                 maximum: 30000
 *                 description: Timeout in milliseconds
 *     responses:
 *       200:
 *         description: Successful search with optimized query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - API key is missing or invalid
 *       429:
 *         description: Too many requests - Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post('/optimized-search', rateLimiter('perplexity', 5, 60), perplexityController.searchComplianceOptimized);

export default router; 