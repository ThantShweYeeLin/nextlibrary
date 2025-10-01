// pages/api/categories/[id].js
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { id } = req.query;
  console.log(`🏷️ API ${req.method} /api/categories/${id} called`);

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid category ID format' 
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db('library');
    const categoriesCollection = db.collection('categories');

    switch (req.method) {
      case 'GET':
        try {
          const category = await categoriesCollection.findOne({ _id: new ObjectId(id) });
          if (!category) {
            return res.status(404).json({ 
              success: false, 
              error: 'Category not found' 
            });
          }
          
          // Optionally include subcategories and books
          const { includeSubcategories, includeBooks } = req.query;
          
          if (includeSubcategories === 'true') {
            const subcategories = await categoriesCollection
              .find({ parentCategory: new ObjectId(id), isActive: true })
              .sort({ sortOrder: 1, name: 1 })
              .toArray();
            category.subcategories = subcategories;
          }
          
          if (includeBooks === 'true') {
            const booksCollection = db.collection('books');
            const books = await booksCollection
              .find({ categories: new ObjectId(id) })
              .toArray();
            category.books = books;
          }
          
          res.status(200).json({ 
            success: true, 
            data: category 
          });
        } catch (error) {
          console.error('❌ Error fetching category:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch category: ' + error.message 
          });
        }
        break;

      case 'PUT':
        try {
          const updateData = {
            ...req.body,
            updatedAt: new Date()
          };
          
          // Validate parent category exists if provided
          if (updateData.parentCategory && updateData.parentCategory !== id) {
            const parentExists = await categoriesCollection.findOne({
              _id: new ObjectId(updateData.parentCategory),
              isActive: true
            });
            
            if (!parentExists) {
              return res.status(400).json({
                success: false,
                error: 'Parent category not found'
              });
            }
            
            // Prevent circular references
            if (updateData.parentCategory === id) {
              return res.status(400).json({
                success: false,
                error: 'Category cannot be its own parent'
              });
            }
          }
          
          const result = await categoriesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Category not found' 
            });
          }
          
          res.status(200).json({ 
            success: true, 
            data: { ...updateData, _id: id } 
          });
        } catch (error) {
          console.error('❌ Error updating category:', error);
          
          // Handle duplicate name error
          if (error.code === 11000) {
            return res.status(400).json({
              success: false,
              error: 'Category with this name already exists'
            });
          }
          
          res.status(500).json({ 
            success: false, 
            error: 'Failed to update category: ' + error.message 
          });
        }
        break;

      case 'DELETE':
        try {
          // Check if category has subcategories
          const subcategoryCount = await categoriesCollection.countDocuments({
            parentCategory: new ObjectId(id),
            isActive: true
          });
          
          if (subcategoryCount > 0) {
            return res.status(400).json({
              success: false,
              error: 'Cannot delete category that has subcategories'
            });
          }
          
          // Check if category is used by books
          const booksCollection = db.collection('books');
          const bookCount = await booksCollection.countDocuments({
            categories: new ObjectId(id)
          });
          
          if (bookCount > 0) {
            return res.status(400).json({
              success: false,
              error: 'Cannot delete category that is assigned to books'
            });
          }
          
          // Soft delete - set isActive to false
          const result = await categoriesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isActive: false, updatedAt: new Date() } }
          );
          
          if (result.matchedCount === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Category not found' 
            });
          }
          
          res.status(200).json({ 
            success: true, 
            message: 'Category deleted successfully' 
          });
        } catch (error) {
          console.error('❌ Error deleting category:', error);
          res.status(500).json({ 
            success: false, 
            error: 'Failed to delete category: ' + error.message 
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