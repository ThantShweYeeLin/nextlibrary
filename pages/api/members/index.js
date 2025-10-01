// pages/api/members/index.js
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  console.log(`👥 API ${req.method} /api/members called`);
  
  try {
    const client = await clientPromise;
    const db = client.db('library');
    const membersCollection = db.collection('members');

    switch (req.method) {
      case 'GET':
        try {
          const { 
            search, 
            page = 1, 
            limit = 10, 
            sortBy = 'lastName', 
            sortOrder = 1,
            status,
            membershipType 
          } = req.query;
          
          const skip = (parseInt(page) - 1) * parseInt(limit);
          
          let query = {};
          
          // Filter by status
          if (status) {
            query.membershipStatus = status;
          }
          
          // Filter by membership type
          if (membershipType) {
            query.membershipType = membershipType;
          }
          
          // Add search functionality
          if (search) {
            query.$or = [
              { firstName: { $regex: search, $options: 'i' } },
              { lastName: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { phone: { $regex: search, $options: 'i' } }
            ];
          }
          
          const members = await membersCollection
            .find(query)
            .sort({ [sortBy]: parseInt(sortOrder) })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();
            
          const total = await membersCollection.countDocuments(query);
          
          console.log(`✅ Successfully fetched ${members.length} members`);
          
          res.status(200).json({ 
            success: true, 
            data: members,
            pagination: {
              current: parseInt(page),
              pages: Math.ceil(total / parseInt(limit)),
              total
            }
          });
        } catch (error) {
          console.error('❌ Error fetching members:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch members: ' + error.message 
          });
        }
        break;

      case 'POST':
        try {
          const member = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Set default expiry date (1 year from join date)
          if (!member.expiryDate) {
            const expiryDate = new Date(member.joinDate || new Date());
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            member.expiryDate = expiryDate;
          }
          
          // Set max books allowed based on membership type
          if (!member.maxBooksAllowed) {
            const maxBooks = {
              'Basic': 3,
              'Premium': 10,
              'Student': 5,
              'Senior': 7
            };
            member.maxBooksAllowed = maxBooks[member.membershipType] || 3;
          }
          
          console.log('📝 Creating new member:', member.firstName, member.lastName);
          const result = await membersCollection.insertOne(member);
          console.log('✅ Member created with ID:', result.insertedId);
          
          res.status(201).json({ 
            success: true, 
            data: { ...member, _id: result.insertedId } 
          });
        } catch (error) {
          console.error('❌ Error creating member:', error);
          
          // Handle duplicate email error
          if (error.code === 11000) {
            return res.status(400).json({
              success: false,
              error: 'Member with this email already exists'
            });
          }
          
          res.status(500).json({ 
            success: false, 
            error: 'Failed to create member: ' + error.message 
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