import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  // Log the request for debugging
  console.log(`[404] ${req.method} ${req.path} - Route not found`);
  console.log(`[404] Original URL: ${req.originalUrl}`);
  console.log(`[404] Base URL: ${req.baseUrl}`);
  console.log(`[404] Query:`, req.query);
  
  // Don't log 404s for favicon or other common non-API requests
  if (!req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: `Route ${req.method} ${req.path} not found`,
    });
  }
  
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    path: req.path,
    originalUrl: req.originalUrl,
    message: 'The requested API endpoint does not exist. Please check the API documentation at /api-docs',
  });
};

