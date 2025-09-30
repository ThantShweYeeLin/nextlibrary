// pages/api/books/[id].js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`📚 API ${req.method} /api/books/${id} called`);

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid book ID format' 
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db('library');
    const booksCollection = db.collection('books');

    switch (req.method) {
      case 'GET':
        try {
          const book = await booksCollection.findOne({ _id: new ObjectId(id) });
          if (!book) {
            return res.status(404).json({ 
              success: false, 
              error: 'Book not found' 
            });
          }
          res.status(200).json({ 
            success: true, 
            data: book 
          });
        } catch (error) {
          console.error('❌ Error fetching book:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch book: ' + error.message 
          });
        }
        break;

      case 'PUT':
        try {
          const updateData = {
            ...req.body,
            updatedAt: new Date()
          };
          
          const result = await booksCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Book not found' 
            });
          }
          
          res.status(200).json({ 
            success: true, 
            data: { ...updateData, _id: id } 
          });
        } catch (error) {
          console.error('❌ Error updating book:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to update book: ' + error.message 
          });
        }
        break;

      case 'DELETE':
        try {
          const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
          if (result.deletedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Book not found' 
            });
          }
          res.status(200).json({ 
            success: true, 
            message: 'Book deleted successfully' 
          });
        } catch (error) {
          console.error('❌ Error deleting book:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to delete book: ' + error.message 
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