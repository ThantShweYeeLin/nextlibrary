// pages/api/borrowings/index.js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  console.log(`📚 API ${req.method} /api/borrowings called`);
  
  try {
    const client = await clientPromise;
    const db = client.db('library');
    const borrowingsCollection = db.collection('borrowings');

    switch (req.method) {
      case 'GET':
        try {
          const { 
            search, 
            page = 1, 
            limit = 10, 
            sortBy = 'borrowDate', 
            sortOrder = -1,
            status,
            memberId,
            bookId,
            overdue = false
          } = req.query;
          
          const skip = (parseInt(page) - 1) * parseInt(limit);
          
          let query = {};
          
          // Filter by status
          if (status) {
            query.status = status;
          }
          
          // Filter by member
          if (memberId && ObjectId.isValid(memberId)) {
            query.member = new ObjectId(memberId);
          }
          
          // Filter by book
          if (bookId && ObjectId.isValid(bookId)) {
            query.book = new ObjectId(bookId);
          }
          
          // Filter overdue items
          if (overdue === 'true') {
            query.status = 'Active';
            query.dueDate = { $lt: new Date() };
          }
          
          // Build aggregation pipeline for populated data
          const pipeline = [
            { $match: query },
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
          ];
          
          // Add search functionality
          if (search) {
            pipeline.unshift({
              $match: {
                $or: [
                  { 'book.title': { $regex: search, $options: 'i' } },
                  { 'member.firstName': { $regex: search, $options: 'i' } },
                  { 'member.lastName': { $regex: search, $options: 'i' } },
                  { 'member.email': { $regex: search, $options: 'i' } }
                ]
              }
            });
          }
          
          // Add sorting and pagination
          pipeline.push(
            { $sort: { [sortBy]: parseInt(sortOrder) } },
            { $skip: skip },
            { $limit: parseInt(limit) }
          );
          
          const borrowings = await borrowingsCollection.aggregate(pipeline).toArray();
          
          // Get total count
          const countPipeline = [...pipeline];
          countPipeline.pop(); // Remove limit
          countPipeline.pop(); // Remove skip
          countPipeline.pop(); // Remove sort
          countPipeline.push({ $count: 'total' });
          
          const countResult = await borrowingsCollection.aggregate(countPipeline).toArray();
          const total = countResult.length > 0 ? countResult[0].total : 0;
          
          console.log(`✅ Successfully fetched ${borrowings.length} borrowings`);
          
          res.status(200).json({ 
            success: true, 
            data: borrowings,
            pagination: {
              current: parseInt(page),
              pages: Math.ceil(total / parseInt(limit)),
              total
            }
          });
        } catch (error) {
          console.error('❌ Error fetching borrowings:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch borrowings: ' + error.message 
          });
        }
        break;

      case 'POST':
        try {
          const { bookId, memberId, librarian, dueDate } = req.body;
          
          if (!ObjectId.isValid(bookId) || !ObjectId.isValid(memberId)) {
            return res.status(400).json({
              success: false,
              error: 'Invalid book or member ID'
            });
          }
          
          // Check if book is available
          const booksCollection = db.collection('books');
          const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
          
          if (!book) {
            return res.status(404).json({
              success: false,
              error: 'Book not found'
            });
          }
          
          if (book.status !== 'Available' || book.availableCopies <= 0) {
            return res.status(400).json({
              success: false,
              error: 'Book is not available for borrowing'
            });
          }
          
          // Check if member can borrow books
          const membersCollection = db.collection('members');
          const member = await membersCollection.findOne({ _id: new ObjectId(memberId) });
          
          if (!member) {
            return res.status(404).json({
              success: false,
              error: 'Member not found'
            });
          }
          
          if (member.membershipStatus !== 'Active') {
            return res.status(400).json({
              success: false,
              error: 'Member account is not active'
            });
          }
          
          if (member.currentBooksCount >= member.maxBooksAllowed) {
            return res.status(400).json({
              success: false,
              error: 'Member has reached maximum book limit'
            });
          }
          
          if (member.fines > 0) {
            return res.status(400).json({
              success: false,
              error: 'Member has outstanding fines'
            });
          }
          
          // Create borrowing record
          const borrowing = {
            book: new ObjectId(bookId),
            member: new ObjectId(memberId),
            borrowDate: new Date(),
            dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
            status: 'Active',
            renewalCount: 0,
            maxRenewals: 2,
            fineAmount: 0,
            librarian: librarian || 'System',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          console.log('📝 Creating new borrowing for book:', book.title);
          const result = await borrowingsCollection.insertOne(borrowing);
          
          // Update book availability
          await booksCollection.updateOne(
            { _id: new ObjectId(bookId) },
            { 
              $inc: { availableCopies: -1 },
              $set: { 
                status: book.availableCopies === 1 ? 'Borrowed' : 'Available',
                updatedAt: new Date()
              }
            }
          );
          
          // Update member's current books count
          await membersCollection.updateOne(
            { _id: new ObjectId(memberId) },
            { 
              $inc: { currentBooksCount: 1 },
              $set: { updatedAt: new Date() }
            }
          );
          
          console.log('✅ Borrowing created with ID:', result.insertedId);
          
          res.status(201).json({ 
            success: true, 
            data: { ...borrowing, _id: result.insertedId } 
          });
        } catch (error) {
          console.error('❌ Error creating borrowing:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to create borrowing: ' + error.message 
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