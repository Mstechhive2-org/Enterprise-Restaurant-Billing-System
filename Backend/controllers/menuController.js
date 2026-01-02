import Menu from '../models/Menu.js';
import Category from '../models/Category.js';

export const getAllMenuItems = async (req, res) => {
  try {
    const items = await Menu.find({ isAvailable: true }).populate('category', 'name');
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addMenuItem = async (req, res) => {
  try {
    let categoryData = req.body.category;

    // If category is a string, find the category by name
    if (typeof categoryData === 'string') {
      const category = await Category.findOne({ name: categoryData });
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }
      categoryData = category._id;
    }

    const newItem = new Menu({ ...req.body, category: categoryData });
    await newItem.save();
    const populatedItem = await Menu.findById(newItem._id).populate('category', 'name');
    res.status(201).json(populatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    let updateData = req.body;

    // If category is a string, find the category by name
    if (typeof updateData.category === 'string') {
      const category = await Category.findOne({ name: updateData.category });
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }
      updateData.category = category._id;
    }

    const updatedItem = await Menu.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('category', 'name');
    if (!updatedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const deletedItem = await Menu.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
