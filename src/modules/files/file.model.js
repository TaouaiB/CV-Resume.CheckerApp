const { Schema, model } = require('mongoose');

const FileSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    storage: {
      adapter: { type: String, default: 'local' },
      path: { type: String, required: true },
      filename: { type: String, required: true },
    },
  },
  { timestamps: true }
);

module.exports = model('File', FileSchema);
