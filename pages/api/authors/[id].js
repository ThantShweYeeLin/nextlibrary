// pages/api/authors/[id].js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`👤 API ${req.method} /api/authors/${id} called`);

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid author ID format' 
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db('library');
    const authorsCollection = db.collection('authors');

    switch (req.method) {
      case 'GET':
        try {
          const author = await authorsCollection.findOne({ _id: new ObjectId(id) });
          if (!author) {
            return res.status(404).json({ 
              success: false, 
              error: 'Author not found' 
            });
          }
          
          // Optionally include books by this author
          const { includeBooks } = req.query;
          if (includeBooks === 'true') {
            const booksCollection = db.collection('books');
            const books = await booksCollection.find({ 
              $or: [
                { authorId: new ObjectId(id) },
                { author: `${author.firstName} ${author.lastName}` }
              ]
            }).toArray();
            author.books = books;
          }
          
          res.status(200).json({ 
            success: true, 
            data: author 
          });
        } catch (error) {
          console.error('❌ Error fetching author:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch author: ' + error.message 
          });
        }
        break;

      case 'PUT':
        try {
          const updateData = {
            ...req.body,
            updatedAt: new Date()
          };
          
          const result = await authorsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Author not found' 
            });
          }
          
          res.status(200).json({ 
            success: true, 
            data: { ...updateData, _id: id } 
          });
        } catch (error) {
          console.error('❌ Error updating author:', error);
          
          // Handle duplicate email error
          if (error.code === 11000) {
            return res.status(400).json({
              success: false,
              error: 'Author with this email already exists'
            });
          }
          
          res.status(500).json({ 
            success: false, 
            error: 'Failed to update author: ' + error.message 
          });
        }
        break;

      case 'DELETE':
        try {
          // Soft delete - set isActive to false instead of removing
          const result = await authorsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isActive: false, updatedAt: new Date() } }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Author not found' 
            });
          }
          
          res.status(200).json({ 
            success: true, 
            message: 'Author deleted successfully' 
          });
        } catch (error) {
          console.error('❌ Error deleting author:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to delete author: ' + error.message 
          });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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