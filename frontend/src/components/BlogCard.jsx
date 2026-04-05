import { Link } from "react-router-dom";

export default function BlogCard({ blog }) {
  return (
    <Link to={`/blogs/${blog.slug}`} className="block group">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-300">
        
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {blog.title}
            </h2>
            
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-[11px]">
                  {blog.author?.charAt(0).toUpperCase() || "A"}
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px] sm:max-w-[200px]">
                  {blog.author}
                </span>
              </div>
              
              <span className="text-slate-300 dark:text-slate-700">•</span>
              
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          
          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
            <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>{blog.likes_count || 0}</span>
          </div>
          
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{blog.comments_count || 0}</span>
          </div>
          
          <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{blog.views_count || 0}</span>
          </div>
        </div>
        
      </div>
    </Link>
  );
}