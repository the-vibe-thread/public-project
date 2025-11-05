import { useEffect, useState } from "react";
import { api } from "../api"; // Adjust the import based on your project structure
import LogoLoader from "./loader";
import styles from "./Blogs.module.css"; // Use CSS Module

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/blogs")
      .then((res) => {
        setBlogs(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LogoLoader />;

  return (
    <div className={`${styles["blogs-page"]} container py-4`}>
      <h2 className="mb-4 text-center">Our Latest Blogs</h2>
      <div className="row">
        {blogs.map((blog) => (
          <div
            className="col-12 col-sm-6 col-lg-4 mb-4 d-flex align-items-stretch"
            key={blog._id}
          >
            <div className={`card h-100 w-100 shadow-sm ${styles["blog-card-custom"]}`}>
              <img
                src={blog.image}
                className={`card-img-top ${styles["blog-card-img"]}`}
                alt={blog.title}
                style={{
                  objectFit: "cover",
                  height: "220px",
                  borderTopLeftRadius: "0.5rem",
                  borderTopRightRadius: "0.5rem",
                }}
              />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{blog.title}</h5>
                <p className="card-text flex-grow-1">{blog.summary}</p>
                <a
                  href={`/blog/${blog.slug}`}
                  className="btn btn-outline-primary mt-auto"
                  style={{ width: "fit-content" }}
                >
                  Read More
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blogs;