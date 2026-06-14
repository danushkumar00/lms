
import React, { useState } from "react";
const UploadCourse = () =>{

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    chapter: "",
  });

  const [video, setVideo] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setErrors({ video: "Please upload a valid video file." });
      return;
    }

    setVideo(file);
    setErrors((prev) => ({ ...prev, video: "" }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.chapter.trim()) newErrors.chapter = "Chapter is required";
    if (!video) newErrors.video = "Video file is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      ...formData,
      video,
    };

    console.log("Submitting:", payload);

    // API call here
    // const form = new FormData();
    // form.append("video", video);
    // form.append("name", formData.name);
    // form.append("description", formData.description);
    // form.append("chapter", formData.chapter);

    alert("Video submitted successfully!");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 border rounded-lg space-y-4"
    >
      <h2 className="text-xl font-semibold">Upload Video</h2>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
      >
        <input
          type="file"
          accept="video/*"
          onChange={(e) => handleFile(e.target.files[0])}
          className="hidden"
          id="video-upload"
        />

        <label htmlFor="video-upload" className="cursor-pointer block">
          {video
            ? `Selected: ${video.name}`
            : "Drag & drop a video here or click to select"}
        </label>
      </div>

      {errors.video && (
        <p className="text-red-500 text-sm">{errors.video}</p>
      )}

      {/* Name */}
      <div>
        <input
          type="text"
          name="name"
          placeholder="Video Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full border rounded p-2"
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description}</p>
        )}
      </div>

      {/* Chapter */}
      <div>
        <input
          type="text"
          name="chapter"
          placeholder="Chapter"
          value={formData.chapter}
          onChange={handleChange}
          className="w-full border rounded p-2"
        />
        {errors.chapter && (
          <p className="text-red-500 text-sm">{errors.chapter}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-black text-white py-2 rounded"
      >
        Upload Video
      </button>
    </form>
  );
}

export default UploadCourse