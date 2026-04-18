import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅  MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`);

    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', false);
    }
  } catch (err) {
    console.error(`❌  MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌  MongoDB connection closed (SIGINT)');
  process.exit(0);
});

export default connectDB;
