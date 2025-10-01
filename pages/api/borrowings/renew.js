// pages/api/borrowings/renew.js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  console.log(`📚 API ${req.method} /api/borrowings/renew called`);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db('library');
    const borrowingsCollection = db.collection('borrowings');
    
    const { borrowingId, librarian } = req.body;
    
    if (!ObjectId.isValid(borrowingId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid borrowing ID'
      });
    }
    
    // Get borrowing details
    const borrowing = await borrowingsCollection.findOne({ _id: new ObjectId(borrowingId) });
    
    if (!borrowing) {
      return res.status(404).json({
        success: false,
        error: 'Borrowing not found'
      });
    }
    
    if (borrowing.status !== 'Active') {
      return res.status(400).json({
        success: false,
        error: 'Only active borrowings can be renewed'
      });
    }
    
    // Check if renewal is allowed
    if (borrowing.renewalCount >= borrowing.maxRenewals) {
      return res.status(400).json({
        success: false,
        error: 'Maximum renewal limit reached'
      });
    }
    
    // Check if overdue
    if (new Date() > borrowing.dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Cannot renew overdue books'
      });
    }
    
    // Calculate new due date (extend by 2 weeks)
    const newDueDate = new Date(borrowing.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 14);
    
    // Update borrowing record
    await borrowingsCollection.updateOne(
      { _id: new ObjectId(borrowingId) },
      { 
        $set: { 
          dueDate: newDueDate,
          librarian: librarian || 'System',
          updatedAt: new Date()
        },
        $inc: { renewalCount: 1 }
      }
    );
    
    console.log('✅ Book renewed successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'Book renewed successfully',
      data: {
        borrowingId,
        newDueDate,
        renewalCount: borrowing.renewalCount + 1,
        remainingRenewals: borrowing.maxRenewals - (borrowing.renewalCount + 1)
      }
    });
  } catch (error) {
    console.error('❌ Error renewing book:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to renew book: ' + error.message 
    });
  }
}