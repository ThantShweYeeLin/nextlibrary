// pages/api/dashboard/stats.js
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  console.log(`📊 API ${req.method} /api/dashboard/stats called`);
  
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
    
    // Get collections
    const booksCollection = db.collection('books');
    const membersCollection = db.collection('members');
    const borrowingsCollection = db.collection('borrowings');
    const authorsCollection = db.collection('authors');
    const categoriesCollection = db.collection('categories');
    
    // Parallel queries for better performance
    const [
      totalBooks,
      availableBooks,
      totalMembers,
      activeMembers,
      totalBorrowings,
      activeBorrowings,
      overdueBorrowings,
      totalAuthors,
      totalCategories,
      recentBorrowings,
      popularBooks,
      membershipStats
    ] = await Promise.all([
      // Books stats
      booksCollection.countDocuments({}),
      booksCollection.countDocuments({ status: 'Available' }),
      
      // Members stats
      membersCollection.countDocuments({}),
      membersCollection.countDocuments({ membershipStatus: 'Active' }),
      
      // Borrowings stats
      borrowingsCollection.countDocuments({}),
      borrowingsCollection.countDocuments({ status: 'Active' }),
      borrowingsCollection.countDocuments({ 
        status: 'Active', 
        dueDate: { $lt: new Date() } 
      }),
      
      // Authors and categories
      authorsCollection.countDocuments({ isActive: true }),
      categoriesCollection.countDocuments({ isActive: true }),
      
      // Recent borrowings
      borrowingsCollection.aggregate([
        { $match: { status: 'Active' } },
        { $sort: { borrowDate: -1 } },
        { $limit: 5 },
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
          $project: {
            borrowDate: 1,
            dueDate: 1,
            bookTitle: { $arrayElemAt: ['$bookDetails.title', 0] },
            memberName: {
              $concat: [
                { $arrayElemAt: ['$memberDetails.firstName', 0] },
                ' ',
                { $arrayElemAt: ['$memberDetails.lastName', 0] }
              ]
            }
          }
        }
      ]).toArray(),
      
      // Popular books
      borrowingsCollection.aggregate([
        { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
        { $sort: { borrowCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookDetails'
          }
        },
        {
          $project: {
            borrowCount: 1,
            title: { $arrayElemAt: ['$bookDetails.title', 0] },
            author: { $arrayElemAt: ['$bookDetails.author', 0] }
          }
        }
      ]).toArray(),
      
      // Membership distribution
      membersCollection.aggregate([
        { $group: { _id: '$membershipType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray()
    ]);
    
    // Calculate additional metrics
    const borrowedBooks = totalBooks - availableBooks;
    const utilizationRate = totalBooks > 0 ? ((borrowedBooks / totalBooks) * 100).toFixed(1) : 0;
    const overdueRate = activeBorrowings > 0 ? ((overdueBorrowings / activeBorrowings) * 100).toFixed(1) : 0;
    
    const stats = {
      books: {
        total: totalBooks,
        available: availableBooks,
        borrowed: borrowedBooks,
        utilizationRate: parseFloat(utilizationRate)
      },
      members: {
        total: totalMembers,
        active: activeMembers,
        inactive: totalMembers - activeMembers
      },
      borrowings: {
        total: totalBorrowings,
        active: activeBorrowings,
        overdue: overdueBorrowings,
        overdueRate: parseFloat(overdueRate)
      },
      content: {
        authors: totalAuthors,
        categories: totalCategories
      },
      recent: {
        borrowings: recentBorrowings,
        popularBooks: popularBooks
      },
      analytics: {
        membershipDistribution: membershipStats
      }
    };
    
    console.log('✅ Successfully fetched dashboard statistics');
    
    res.status(200).json({ 
      success: true, 
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics: ' + error.message 
    });
  }
}