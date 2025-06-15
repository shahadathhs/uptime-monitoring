import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory of the data folder
const baseDir = path.join(__dirname, '/../.data/');

// Utility function to build file path
const getFilePath = (dir, file) => path.join(baseDir, dir, `${file}.json`);

// File system utility module
const fileLib = {
  // Create a new file
  async create(dir, file, data) {
    const filePath = getFilePath(dir, file);
    try {
      const handle = await fs.open(filePath, 'wx');
      await handle.writeFile(JSON.stringify(data));
      await handle.close();
    } catch (err) {
      throw new Error(`Create failed: ${err.message}`);
    }
  },

  // Read file contents
  async read(dir, file) {
    const filePath = getFilePath(dir, file);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (err) {
      throw new Error(`Read failed: ${err.message}`);
    }
  },

  // Update an existing file
  async update(dir, file, data) {
    const filePath = getFilePath(dir, file);
    try {
      const handle = await fs.open(filePath, 'r+');
      await handle.truncate();
      await handle.writeFile(JSON.stringify(data));
      await handle.close();
    } catch (err) {
      throw new Error(`Update failed: ${err.message}`);
    }
  },

  // Delete a file
  async delete(dir, file) {
    const filePath = getFilePath(dir, file);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      throw new Error(`Delete failed: ${err.message}`);
    }
  },

  // List all JSON files (without .json extension)
  async list(dir) {
    const directoryPath = path.join(baseDir, dir);
    try {
      const files = await fs.readdir(directoryPath);
      return files
        .filter((fileName) => fileName.endsWith('.json'))
        .map((fileName) => fileName.replace('.json', ''));
    } catch (err) {
      throw new Error(`List failed: ${err.message}`);
    }
  },
};

export default fileLib;
