// pages/api/borrowings/return.js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  console.log(`📚 API ${req.method} /api/borrowings/return called`);
  
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
    const booksCollection = db.collection('books');
    const membersCollection = db.collection('members');
    
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
    
    if (borrowing.status !== 'Active' && borrowing.status !== 'Overdue') {
      return res.status(400).json({
        success: false,
        error: 'Book is already returned'
      });
    }
    
    const returnDate = new Date();
    let fineAmount = 0;
    
    // Calculate fine if overdue
    if (returnDate > borrowing.dueDate) {
      const daysOverdue = Math.ceil((returnDate - borrowing.dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 0.50; // $0.50 per day
    }
    
    // Update borrowing record
    await borrowingsCollection.updateOne(
      { _id: new ObjectId(borrowingId) },
      { 
        $set: { 
          returnDate,
          status: 'Returned',
          fineAmount,
          librarian: librarian || 'System',
          updatedAt: new Date()
        } 
      }
    );
    
    // Update book availability
    const book = await booksCollection.findOne({ _id: borrowing.book });
    await booksCollection.updateOne(
      { _id: borrowing.book },
      { 
        $inc: { availableCopies: 1 },
        $set: { 
          status: 'Available',
          updatedAt: new Date()
        }
      }
    );
    
    // Update member's current books count and add fine if applicable
    const memberUpdate = { 
      $inc: { currentBooksCount: -1 },
      $set: { updatedAt: new Date() }
    };
    
    if (fineAmount > 0) {
      memberUpdate.$inc.fines = fineAmount;
    }
    
    await membersCollection.updateOne(
      { _id: borrowing.member },
      memberUpdate
    );
    
    console.log('✅ Book returned successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'Book returned successfully',
      data: {
        borrowingId,
        returnDate,
        fineAmount,
        wasOverdue: fineAmount > 0
      }
    });
  } catch (error) {
    console.error('❌ Error returning book:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to return book: ' + error.message 
    });
  }
}