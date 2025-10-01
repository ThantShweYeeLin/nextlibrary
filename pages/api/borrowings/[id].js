// pages/api/borrowings/[id].js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`📚 API ${req.method} /api/borrowings/${id} called`);

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid borrowing ID format' 
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db('library');
    const borrowingsCollection = db.collection('borrowings');

    switch (req.method) {
      case 'GET':
        try {
          const borrowing = await borrowingsCollection.aggregate([
            { $match: { _id: new ObjectId(id) } },
            {
              $lookup: {
                from: 'books',
                localField: 'book',
                foreignField: '_id',
                as: 'bookDetails'
              }
            },
            {
              $lookup: {
                from: 'members',
                localField: 'member',
                foreignField: '_id',
                as: 'memberDetails'
              }
            },
            {
              $addFields: {
                book: { $arrayElemAt: ['$bookDetails', 0] },
                member: { $arrayElemAt: ['$memberDetails', 0] },
                isOverdue: {
                  $and: [
                    { $eq: ['$status', 'Active'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                }
              }
            },
            {
              $project: {
                bookDetails: 0,
                memberDetails: 0
              }
            }
          ]).toArray();
          
          if (borrowing.length === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Borrowing not found' 
            });
          }
          
          res.status(200).json({ 
            success: true, 
            data: borrowing[0] 
          });
        } catch (error) {
          console.error('❌ Error fetching borrowing:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch borrowing: ' + error.message 
          });
        }
        break;

      case 'PUT':
        try {
          const updateData = {
            ...req.body,
            updatedAt: new Date()
          };
          
          const result = await borrowingsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Borrowing not found' 
            });
          }
          
          res.status(200).json({ 
            success: true, 
            data: { ...updateData, _id: id } 
          });
        } catch (error) {
          console.error('❌ Error updating borrowing:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to update borrowing: ' + error.message 
          });
        }
        break;

      case 'DELETE':
        try {
          // Get borrowing details first
          const borrowing = await borrowingsCollection.findOne({ _id: new ObjectId(id) });
          if (!borrowing) {
            return res.status(404).json({ 
              success: false, 
              error: 'Borrowing not found' 
            });
          }
          
          // Only allow deletion of returned or cancelled borrowings
          if (borrowing.status === 'Active') {
            return res.status(400).json({
              success: false,
              error: 'Cannot delete active borrowing. Please return the book first.'
            });
          }
          
          const result = await borrowingsCollection.deleteOne({ _id: new ObjectId(id) });
          
          res.status(200).json({ 
            success: true, 
            message: 'Borrowing deleted successfully' 
          });
        } catch (error) {
          console.error('❌ Error deleting borrowing:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to delete borrowing: ' + error.message 
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