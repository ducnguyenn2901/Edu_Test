import React from 'react';
import { HelpCircle, Book, MessageCircle, FileText, ChevronRight, Search, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

const faqs = [
  {
    question: "Làm thế nào để tạo một kỳ thi mới?",
    answer: "Để tạo kỳ thi, bạn vào mục 'Quản lý kỳ thi' từ thanh điều hướng của giáo viên, sau đó nhấn nút 'Tạo kỳ thi mới'. Bạn có thể chọn câu hỏi từ ngân hàng câu hỏi hoặc tạo câu hỏi mới."
  },
  {
    question: "Tôi có thể nhập câu hỏi từ file Excel không?",
    answer: "Có, hệ thống hỗ trợ nhập câu hỏi hàng loạt từ file Excel. Trong mục 'Ngân hàng câu hỏi', hãy chọn 'Import' và tải lên file theo mẫu quy định."
  },
  {
    question: "Làm sao để xem kết quả thi của học sinh?",
    answer: "Bạn có thể xem kết quả trong mục 'Kết quả thi'. Hệ thống cung cấp báo cáo chi tiết cho từng học sinh và thống kê tổng quan cho cả lớp."
  },
  {
    question: "Học sinh tham gia lớp học như thế nào?",
    answer: "Học sinh có thể tham gia lớp học bằng cách nhập 'Mã lớp' mà giáo viên cung cấp trong mục 'Tham gia lớp học' trên bảng điều khiển của học sinh."
  }
];

const categories = [
  { icon: Book, title: "Hướng dẫn sử dụng", description: "Tài liệu chi tiết cho giáo viên và học sinh", count: 12 },
  { icon: FileText, title: "Câu hỏi thường gặp", description: "Giải đáp các thắc mắc phổ biến nhất", count: 8 },
  { icon: MessageCircle, title: "Hỗ trợ trực tuyến", description: "Chat trực tiếp với đội ngũ hỗ trợ kỹ thuật", count: 24 },
];

export function HelpCenter() {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 p-12 md:p-20 text-white shadow-2xl shadow-blue-900/20 dark:shadow-none border border-white/10 group">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center px-5 py-2 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-[10px] font-black uppercase tracking-[0.25em] shadow-lg shadow-black/5">
             🚀 Trung tâm hỗ trợ EduTest Pro
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
            Chúng tôi có thể <br/> giúp gì cho bạn?
          </h1>
          <div className="relative max-w-xl mx-auto group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-200 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm hướng dẫn, câu hỏi..." 
              className="w-full pl-16 pr-8 py-6 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl text-white placeholder:text-blue-200 focus:outline-none focus:ring-4 focus:ring-white/10 transition-all text-lg font-medium"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map((cat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/10 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 group cursor-pointer">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-blue-500/5">
              <cat.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{cat.title}</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">{cat.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{cat.count} tài liệu</span>
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* FAQs Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Câu hỏi phổ biến</h2>
            <button className="text-sm font-black text-blue-600 hover:underline uppercase tracking-widest">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-blue-200">
                <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                  <span className="text-lg font-bold text-gray-900 dark:text-white pr-4">{faq.question}</span>
                  <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center group-open:rotate-180 transition-transform">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </summary>
                <div className="px-8 pb-8 text-gray-500 dark:text-slate-400 font-medium leading-relaxed animate-in slide-in-from-top-2">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Contact Sidebar */}
        <div className="space-y-8">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Liên hệ</h2>
          <div className="bg-gray-900 dark:bg-slate-950 rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700" />
            
            <p className="text-gray-400 font-medium relative z-10">Nếu bạn không tìm thấy câu trả lời mong muốn, hãy liên hệ với chúng tôi.</p>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email</p>
                  <p className="font-bold text-sm">support@edutest.pro</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hotline</p>
                  <p className="font-bold text-sm">1900 8198</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Văn phòng</p>
                  <p className="font-bold text-sm">Hà Nội, Việt Nam</p>
                </div>
              </div>
            </div>

            <button className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 group/btn">
              Gửi tin nhắn ngay
              <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
