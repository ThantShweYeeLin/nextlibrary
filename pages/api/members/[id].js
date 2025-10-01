// pages/api/members/[id].js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`👥 API ${req.method} /api/members/${id} called`);

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid member ID format' 
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db('library');
    const membersCollection = db.collection('members');

    switch (req.method) {
      case 'GET':
        try {
          const member = await membersCollection.findOne({ _id: new ObjectId(id) });
          if (!member) {
            return res.status(404).json({ 
              success: false, 
              error: 'Member not found' 
            });
          }
          
          // Optionally include borrowing history
          const { includeBorrowings } = req.query;
          if (includeBorrowings === 'true') {
            const borrowingsCollection = db.collection('borrowings');
            const borrowings = await borrowingsCollection
              .find({ member: new ObjectId(id) })
              .sort({ borrowDate: -1 })
              .toArray();
            member.borrowings = borrowings;
          }
          
          res.status(200).json({ 
            success: true, 
            data: member 
          });
        } catch (error) {
          console.error('❌ Error fetching member:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch member: ' + error.message 
          });
        }
        break;

      case 'PUT':
        try {
          const updateData = {
            ...req.body,
            updatedAt: new Date()
          };
          
          const result = await membersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Member not found' 
            });
          }
          
          res.status(200).json({ 
            success: true, 
            data: { ...updateData, _id: id } 
          });
        } catch (error) {
          console.error('❌ Error updating member:', error);
          
          // Handle duplicate email error
          if (error.code === 11000) {
            return res.status(400).json({
              success: false,
              error: 'Member with this email already exists'
            });
          }
          
          res.status(500).json({ 
            success: false, 
            error: 'Failed to update member: ' + error.message 
          });
        }
        break;

      case 'DELETE':
        try {
          // Check if member has active borrowings
          const borrowingsCollection = db.collection('borrowings');
          const activeBorrowings = await borrowingsCollection.countDocuments({
            member: new ObjectId(id),
            status: { $in: ['Active', 'Overdue'] }
          });
          
          if (activeBorrowings > 0) {
            return res.status(400).json({
              success: false,
              error: 'Cannot delete member with active borrowings'
            });
          }
          
          const result = await membersCollection.deleteOne({ _id: new ObjectId(id) });
          if (result.deletedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Member not found' 
            });
          }
          
          res.status(200).json({ 
            success: true, 
            message: 'Member deleted successfully' 
          });
        } catch (error) {
          console.error('❌ Error deleting member:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to delete member: ' + error.message 
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