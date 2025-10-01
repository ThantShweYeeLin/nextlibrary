// pages/api/authors/index.js
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  console.log(`👤 API ${req.method} /api/authors called`);
  
  try {
    const client = await clientPromise;
    const db = client.db('library');
    const authorsCollection = db.collection('authors');

    switch (req.method) {
      case 'GET':
        try {
          const { search, page = 1, limit = 10, sortBy = 'lastName', sortOrder = 1 } = req.query;
          const skip = (parseInt(page) - 1) * parseInt(limit);
          
          let query = { isActive: true };
          
          // Add search functionality
          if (search) {
            query.$or = [
              { firstName: { $regex: search, $options: 'i' } },
              { lastName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { nationality: { $regex: search, $options: 'i' } }
            ];
          }
          
          const authors = await authorsCollection
            .find(query)
            .sort({ [sortBy]: parseInt(sortOrder) })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();
            
          const total = await authorsCollection.countDocuments(query);
          
          console.log(`✅ Successfully fetched ${authors.length} authors`);
          
          res.status(200).json({ 
            success: true, 
            data: authors,
            pagination: {
              current: parseInt(page),
              pages: Math.ceil(total / parseInt(limit)),
              total
            }
          });
        } catch (error) {
          console.error('❌ Error fetching authors:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch authors: ' + error.message 
          });
        }
        break;

      case 'POST':
        try {
          const author = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          console.log('📝 Creating new author:', author.firstName, author.lastName);
          const result = await authorsCollection.insertOne(author);
          console.log('✅ Author created with ID:', result.insertedId);
          
          res.status(201).json({ 
            success: true, 
            data: { ...author, _id: result.insertedId } 
          });
        } catch (error) {
          console.error('❌ Error creating author:', error);
          
          // Handle duplicate email error
          if (error.code === 11000) {
            return res.status(400).json({
              success: false,
              error: 'Author with this email already exists'
            });
          }
          
          res.status(500).json({ 
            success: false, 
            error: 'Failed to create author: ' + error.message 
          });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ 
          success: false, 
          error: `Method ${req.method} not allowed` 
        });
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed: ' + error.message 
    });
  }
}