// pages/api/search/index.js
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  console.log(`🔍 API ${req.method} /api/search called`);
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db('library');
    
    const { 
      q: query, 
      type = 'all', 
      limit = 10 
    } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }
    
    const searchRegex = { $regex: query, $options: 'i' };
    const searchLimit = parseInt(limit);
    
    let results = {};
    
    // Search books
    if (type === 'all' || type === 'books') {
      const books = await db.collection('books').find({
        $or: [
          { title: searchRegex },
          { author: searchRegex },
          { description: searchRegex },
          { isbn: searchRegex },
          { publisher: searchRegex }
        ]
      }).limit(searchLimit).toArray();
      
      results.books = books.map(book => ({
        ...book,
        type: 'book'
      }));
    }
    
    // Search authors
    if (type === 'all' || type === 'authors') {
      const authors = await db.collection('authors').find({
        isActive: true,
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { biography: searchRegex },
          { nationality: searchRegex }
        ]
      }).limit(searchLimit).toArray();
      
      results.authors = authors.map(author => ({
        ...author,
        type: 'author',
        fullName: `${author.firstName} ${author.lastName}`
      }));
    }
    
    // Search members
    if (type === 'all' || type === 'members') {
      const members = await db.collection('members').find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      }).limit(searchLimit).toArray();
      
      results.members = members.map(member => ({
        ...member,
        type: 'member',
        fullName: `${member.firstName} ${member.lastName}`
      }));
    }
    
    // Search categories
    if (type === 'all' || type === 'categories') {
      const categories = await db.collection('categories').find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      }).limit(searchLimit).toArray();
      
      results.categories = categories.map(category => ({
        ...category,
        type: 'category'
      }));
    }
    
    // If searching all, combine and sort by relevance
    if (type === 'all') {
      const allResults = [
        ...(results.books || []),
        ...(results.authors || []),
        ...(results.members || []),
        ...(results.categories || [])
      ];
      
      // Simple relevance scoring based on exact matches and position
      allResults.forEach(item => {
        item.relevanceScore = 0;
        const searchLower = query.toLowerCase();
        
        // Check different fields based on type
        const fieldsToCheck = {
          book: ['title', 'author', 'description'],
          author: ['firstName', 'lastName', 'biography'],
          member: ['firstName', 'lastName', 'email'],
          category: ['name', 'description']
        };
        
        fieldsToCheck[item.type]?.forEach(field => {
          if (item[field]) {
            const fieldLower = item[field].toLowerCase();
            if (fieldLower === searchLower) {
              item.relevanceScore += 10; // Exact match
            } else if (fieldLower.startsWith(searchLower)) {
              item.relevanceScore += 5; // Starts with
            } else if (fieldLower.includes(searchLower)) {
              item.relevanceScore += 1; // Contains
            }
          }
        });
      });
      
      // Sort by relevance score and take top results
      allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      results = { all: allResults.slice(0, searchLimit) };
    }
    
    // Count total results
    const totalResults = Object.values(results).reduce((total, arr) => total + arr.length, 0);
    
    console.log(`✅ Successfully found ${totalResults} search results`);
    
    res.status(200).json({ 
      success: true, 
      data: results,
      query,
      totalResults,
      searchType: type
    });
  } catch (error) {
    console.error('❌ Error performing search:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed: ' + error.message 
    });
  }
}