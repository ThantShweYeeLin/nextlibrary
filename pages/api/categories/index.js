// pages/api/categories/index.js
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  console.log(`🏷️ API ${req.method} /api/categories called`);
  
  try {
    const client = await clientPromise;
    const db = client.db('library');
    const categoriesCollection = db.collection('categories');

    switch (req.method) {
      case 'GET':
        try {
          const { 
            search, 
            page = 1, 
            limit = 50, 
            sortBy = 'sortOrder', 
            sortOrder = 1,
            parentOnly = false,
            tree = false
          } = req.query;
          
          const skip = (parseInt(page) - 1) * parseInt(limit);
          
          let query = { isActive: true };
          
          // Filter for parent categories only
          if (parentOnly === 'true') {
            query.parentCategory = null;
          }
          
          // Add search functionality
          if (search) {
            query.$or = [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ];
          }
          
          // Return hierarchical tree structure
          if (tree === 'true') {
            const categories = await categoriesCollection.aggregate([
              { $match: { isActive: true } },
              {
                $lookup: {
                  from: 'categories',
                  localField: '_id',
                  foreignField: 'parentCategory',
                  as: 'subcategories'
                }
              },
              { $match: { parentCategory: null } },
              { $sort: { sortOrder: 1, name: 1 } }
            ]).toArray();
            
            return res.status(200).json({ 
              success: true, 
              data: categories
            });
          }
          
          const categories = await categoriesCollection
            .find(query)
            .sort({ [sortBy]: parseInt(sortOrder), name: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();
            
          const total = await categoriesCollection.countDocuments(query);
          
          console.log(`✅ Successfully fetched ${categories.length} categories`);
          
          res.status(200).json({ 
            success: true, 
            data: categories,
            pagination: {
              current: parseInt(page),
              pages: Math.ceil(total / parseInt(limit)),
              total
            }
          });
        } catch (error) {
          console.error('❌ Error fetching categories:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch categories: ' + error.message 
          });
        }
        break;

      case 'POST':
        try {
          const category = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Validate parent category exists if provided
          if (category.parentCategory) {
            const { ObjectId } = await import('mongodb');
            const parentExists = await categoriesCollection.findOne({
              _id: new ObjectId(category.parentCategory),
              isActive: true
            });
            
            if (!parentExists) {
              return res.status(400).json({
                success: false,
                error: 'Parent category not found'
              });
            }
          }
          
          console.log('📝 Creating new category:', category.name);
          const result = await categoriesCollection.insertOne(category);
          console.log('✅ Category created with ID:', result.insertedId);
          
          res.status(201).json({ 
            success: true, 
            data: { ...category, _id: result.insertedId } 
          });
        } catch (error) {
          console.error('❌ Error creating category:', error);
          
          // Handle duplicate name error
          if (error.code === 11000) {
            return res.status(400).json({
              success: false,
              error: 'Category with this name already exists'
            });
          }
          
          res.status(500).json({ 
            success: false, 
            error: 'Failed to create category: ' + error.message 
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