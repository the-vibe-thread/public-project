import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api"; // Adjust the import based on your project structure

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/blogs/${slug}`)
      .then((res) => {
        setBlog(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (!blog) return <div>Blog not found.</div>;

  return (
    <div className="container py-4">
      <h2 className="mb-3">{blog.title}</h2>
      {blog.image && (
        <img
          src={blog.image}
          alt={blog.title}
          className="img-fluid rounded mb-4"
          style={{ maxHeight: "350px", objectFit: "cover", width: "100%" }}
        />
      )}
      <div className="mb-2 text-muted">
        {blog.author && <span>By {blog.author} </span>}
        {blog.date && <span> | {new Date(blog.date).toLocaleDateString()}</span>}
      </div>
      <div style={{ whiteSpace: "pre-line", fontSize: "1.1rem" }}>
        {blog.content}
      </div>
    </div>
  );
};

export default BlogDetail;