import { Link } from "react-router-dom";

export default function BlogCard({ blog }) {
  return (
    <Link to={`/blogs/${blog.slug}`}>
      <div className="bg-white border mt-5 border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-cyan-300 transition-all duration-300 group">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-cyan-600 transition line-clamp-2">
              {blog.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {blog.author.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-gray-900">{blog.author}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(blog.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
          
          <svg className="w-6 h-6 text-gray-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-500 transition">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{blog.likes_count}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-cyan-500 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium">{blog.comments_count}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-500 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">{blog.views_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}