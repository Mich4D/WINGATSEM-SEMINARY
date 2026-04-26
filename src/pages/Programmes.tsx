import React, { useState, useEffect } from 'react';
import { Book, Award, GraduationCap, ChevronRight, X, Globe } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const diplomaCourses = [
  { code: "WGTS 101", title: "SPIRITUAL LIFE (SPIRITUAL FORMATION)", description: "Examines the believer’s growth in holiness, character development, and consistent fellowship with God.", ref: "Galatians 5:22–23" },
  { code: "WGTS 102", title: "PRAYER LIFE (BIBLICAL PRAYER)", description: "Introduces the principles, patterns, and discipline of effective prayer in Christian life and ministry.", ref: "Luke 18:1" },
  { code: "WGTS 103", title: "THE BIBLE (BIBLIOLOGY)", description: "Studies the inspiration, authority, structure, and reliability of the Holy Scriptures.", ref: "2 Timothy 3:16–17" },
  { code: "WGTS 104", title: "HOMILETICS (PREACHING)", description: "Focuses on sermon preparation, structure, and delivery for effective proclamation of God’s Word.", ref: "2 Timothy 4:2" },
  { code: "WGTS 105", title: "DYNAMIC FAITH (FAITH PRINCIPLES)", description: "Explores the operation and application of faith in Christian living and ministry.", ref: "Hebrews 11:1" },
  { code: "WGTS 106", title: "SATANOLOGY (DOCTRINE OF SATAN)", description: "Examines the origin, activities, and limitations of Satan and demons, including spiritual warfare.", ref: "Ephesians 6:11–12" },
  { code: "WGTS 107", title: "HERMENEUTICS (BIBLICAL INTERPRETATION)", description: "Introduces sound principles and methods for accurate interpretation of Scripture.", ref: "2 Timothy 2:15" },
  { code: "WGTS 108", title: "CHRISTIAN COUNSELLING", description: "Provides foundational knowledge and skills for biblical counseling and pastoral care.", ref: "Galatians 6:2" },
  { code: "WGTS 109", title: "NEW TESTAMENT SURVEY", description: "Gives a general overview of the New Testament books, authors, and central themes.", ref: "Luke 24:44" },
  { code: "WGTS 110", title: "EVANGELISM (SOUL WINNING)", description: "Teaches the biblical mandate and practical strategies for winning souls.", ref: "Matthew 28:19–20" },
  { code: "WGTS 111", title: "MINISTRY (INTRODUCTION TO MINISTRY)", description: "Explores the nature, purpose, and responsibilities of Christian ministry.", ref: "1 Corinthians 4:1" },
  { code: "WGTS 112", title: "LEADERSHIP PRINCIPLES", description: "Develops biblical leadership qualities, ethics, and administrative skills.", ref: "Exodus 18:21" },
  { code: "WGTS 113", title: "CHURCH HISTORY", description: "Surveys the historical development and growth of the Church through the ages.", ref: "Hebrews 12:1" },
  { code: "WGTS 114", title: "BIBLE DOCTRINE (SYSTEMATIC THEOLOGY)", description: "Introduces foundational doctrines of the Christian faith.", ref: "Titus 2:1" },
  { code: "WGTS 115", title: "CONFLICT RESOLUTION", description: "Examines biblical principles for resolving conflicts within the church and ministry.", ref: "Matthew 18:15" },
  { code: "WGTS 116", title: "SEVEN DISPENSATIONS", description: "Studies God’s progressive dealings with humanity across different biblical periods.", ref: "Ephesians 1:10" },
  { code: "WGTS 117", title: "WOMEN IN MINISTRY", description: "Explores the role and contributions of women in biblical and contemporary ministry.", ref: "Joel 2:28" },
  { code: "WGTS 118", title: "DIVINE CALLING", description: "Examines the concept, nature, and response to God’s call into ministry.", ref: "Jeremiah 1:5" },
  { code: "WGTS 119", title: "FIVE-FOLD MINISTRY", description: "Studies the ministry offices given to the Church for growth and edification.", ref: "Ephesians 4:11" },
  { code: "WGTS 120", title: "ACTS OF THE APOSTLES", description: "Analyzes the mission, power, and expansion of the early Church.", ref: "Acts 1:8" }
];

const bachelorCourses = [
  { code: "PTM 203", title: "CHRISTIAN CARE", description: "A study of biblical principles for providing spiritual, emotional, and pastoral care within the church and community." },
  { code: "PTM 202", title: "DISCIPLESHIP", description: "A study of principles and methods for guiding believers into spiritual maturity and Christlike living." },
  { code: "THS 202", title: "COMPARATIVE RELIGION", description: "A study of major world religions compared with Christianity, focusing on beliefs, practices, and apologetic engagement." },
  { code: "CHH 102", title: "CHURCH HISTORY II", description: "A survey of church development from the Reformation to modern times, including global Christianity." },
  { code: "LAN 102", title: "ELEMENTARY GREEK", description: "An introduction to New Testament Greek, focusing on basic grammar, vocabulary, and simple translation." },
  { code: "STH 306", title: "TYPOLOGY", description: "A study of Old Testament types and their fulfillment in the New Testament in relation to Christ." },
  { code: "STH 307", title: "BIBLICAL COSMOLOGY", description: "A study of creation, the structure of the universe, and God’s sustaining power." },
  { code: "BST 101", title: "OLD TESTAMENT SURVEY", description: "An overview of the Old Testament books, themes, and theological message." },
  { code: "ADM 201", title: "CHURCH ADMINISTRATION", description: "A study of principles of organization, leadership, and effective church management." },
  { code: "ADM 202", title: "FINANCIAL MANAGEMENT IN MINISTRY", description: "A study of biblical principles of stewardship, budgeting, accountability, and financial integrity in ministry." },
  { code: "MTH 102", title: "SPIRITUAL FORMATION", description: "A study of spiritual disciplines, character development, and practices that shape Christlike maturity." },
  { code: "LAN 201", title: "ELEMENTARY HEBREW", description: "An introduction to Old Testament Hebrew, focusing on grammar, vocabulary, and basic translation skills." },
  { code: "BST 305", title: "STUDY OF REVELATION", description: "An in-depth study of the book of Revelation, focusing on prophetic themes, symbolism, and eschatology." },
  { code: "STH 101", title: "INTRODUCTION TO SYSTEMATIC THEOLOGY", description: "A foundational study of theological method, structure, and major doctrines of the Christian faith." },
  { code: "STH 102", title: "BIBLIOLOGY", description: "A study of the nature, inspiration, authority, and interpretation of Scripture." },
  { code: "STH 201", title: "THEOLOGY PROPER", description: "A study of the nature, attributes, and works of God." },
  { code: "STH 202", title: "ANGELOLOGY", description: "A study of angels, their nature, roles, and activities according to Scripture." },
  { code: "STH 203", title: "ANTHROPOLOGY", description: "A study of the origin, nature, and purpose of humanity from a biblical perspective." },
  { code: "STH 204", title: "HAMARTIOLOGY", description: "A study of sin, its origin, nature, effects, and consequences on humanity." },
  { code: "STH 205", title: "CULTISM AND OCCULT PRACTICES", description: "A study of cult systems, occult practices, spiritual deception, and biblical responses to false spiritual powers, including their origins, operations, and influence on individuals and the church." },
  { code: "STH 206", title: "MODERN CULTS", description: "A study of contemporary cult movements, their structures, leadership patterns, recruitment methods, psychological control techniques, and their impact on modern society and Christianity." },
  { code: "STH 301", title: "CHRISTOLOGY", description: "A study of the person, nature, and work of Jesus Christ." },
  { code: "STH 302", title: "SOTERIOLOGY", description: "A study of salvation, including grace, faith, redemption, and justification." },
  { code: "STH 303", title: "PNEUMATOLOGY", description: "A study of the person, work, and gifts of the Holy Spirit." },
  { code: "STH 304", title: "ECCLESIOLOGY", description: "A study of the nature, structure, mission, and function of the church." },
  { code: "STH 305", title: "ESCHATOLOGY", description: "A study of last things, including death, judgment, resurrection, and the final kingdom of God." }
];

const masterCourses = [
  { code: "MTH 501", title: "ADVANCED HERMENEUTICS", description: "In-depth study of biblical interpretation methods with a focus on original languages and historical context." },
  { code: "MTH 502", title: "CONTEMPORARY THEOLOGY", description: "Analysis of modern theological movements, thinkers, and their impact on the global church." },
  { code: "MTH 503", title: "ADVANCED PASTORAL COUNSELLING", description: "Integration of theological principles and psychological insights for advanced pastoral care." },
  { code: "MTH 504", title: "CHURCH GROWTH STRATEGIES", description: "Biblical and practical examination of healthy church growth, leadership structures, and missional focus." },
  { code: "MTH 505", title: "RESEARCH METHODOLOGY", description: "Preparation for academic theological research, thesis writing, and scholarly communication." },
  { code: "MTH 506", title: "ADVANCED APOLOGETICS", description: "Rigorous defense of the Christian faith against modern philosophical, scientific, and cultural challenges." }
];

const doctorateCourses = [
  { code: "DTH 701", title: "SEMINAR IN THEOLOGICAL METHOD", description: "Advanced doctoral seminar on the epistemology and methodology of doing theology." },
  { code: "DTH 702", title: "GLOBAL CHRISTIANITY", description: "Research into the shift of global Christianity and its implications for modern theology and missions." },
  { code: "DTH 703", title: "ADVANCED BIBLICAL THEOLOGY", description: "Comprehensive study of the unified theological message across the Old and New Testaments." },
  { code: "DTH 704", title: "ETHICS & CONTEMPORARY ISSUES", description: "Complex ethical decision making from a robust biblical and theological framework." },
  { code: "DTH 705", title: "DISSERTATION PROPOSAL", description: "Guided development of the original doctoral research dissertation proposal." },
  { code: "DTH 706", title: "DISSERTATION RESEARCH & WRITING", description: "Execution and defense of an original, significant contribution to theological scholarship." }
];

const programmes = [
  {
    title: "Diploma in Theology",
    duration: "2 Years",
    icon: <Book size={24} />,
    description: "A foundational programme designed for lay leaders and those beginning their theological journey. Covers essential biblical studies, theology, and practical ministry.",
    requirements: "O'Level Certificate or equivalent.",
    courses: diplomaCourses
  },
  {
    title: "Bachelor of Theology",
    duration: "4 Years",
    icon: <GraduationCap size={24} />,
    description: "A comprehensive undergraduate degree preparing students for full-time pastoral ministry, missions, or further academic study. In-depth study of biblical languages, systematic theology, and church history.",
    requirements: "Diploma in Theology or equivalent A'Level qualifications.",
    courses: bachelorCourses
  },
  {
    title: "Master of Theology",
    duration: "2 Years",
    icon: <Award size={24} />,
    description: "Advanced theological study for those seeking to specialize in a specific area of theology, biblical studies, or pastoral care. Includes a major research thesis.",
    requirements: "Bachelor of Theology with a minimum of Second Class Lower.",
    courses: masterCourses
  },
  {
    title: "Doctorate in Theology",
    duration: "3-5 Years",
    icon: <Award size={24} />,
    description: "The highest level of academic theological study, designed for those called to teach in seminaries or universities, or to produce significant theological research.",
    requirements: "Master of Theology with a strong research component.",
    courses: doctorateCourses
  }
];

export default function Programmes() {
  const [selectedProgramme, setSelectedProgramme] = useState<any>(null);
  const location = useLocation();

  // Automatically open the programme details if accessed from footer links
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const progParam = params.get('prog');
    if (progParam) {
      const found = programmes.find(p => p.title.includes(progParam));
      if (found) {
        setSelectedProgramme(found);
        // Scroll to top to ensure the modal is visible and centered
        window.scrollTo(0, 0);
      }
    }
  }, [location.search]);

  return (
    <div className="bg-slate-50 min-h-screen py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">Academic Programmes</h1>
          <div className="w-24 h-1 bg-yellow-600 mx-auto rounded-full mb-6"></div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We offer a range of accredited programmes designed to equip you for your specific calling, available both online and on-campus.
            <span className="block mt-4 text-xs font-black text-yellow-700 uppercase tracking-[0.3em] bg-yellow-500/10 py-3 rounded-full inline-block px-10 border border-yellow-500/20 shadow-sm leading-relaxed">
              Fully Loaded in Both English & Yoruba Languages
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {programmes.map((prog, idx) => (
            <div 
              key={idx} 
              className={`bg-white rounded-2xl p-8 shadow-sm border border-slate-100 transition-all ${prog.courses ? 'hover:shadow-md cursor-pointer hover:border-yellow-300' : 'hover:shadow-md'}`}
              onClick={() => prog.courses && setSelectedProgramme(prog)}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center">
                  {prog.icon}
                </div>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {prog.duration}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{prog.title}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">{prog.description}</p>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                <h4 className="text-sm font-bold text-slate-900 mb-1">Entry Requirements:</h4>
                <p className="text-sm text-slate-600">{prog.requirements}</p>
              </div>
              {prog.courses && (
                <button 
                  className="flex items-center text-yellow-600 font-semibold hover:text-yellow-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProgramme(prog);
                  }}
                >
                  View Curriculum <ChevronRight size={16} className="ml-1" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-20 bg-slate-900 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
          
          <h2 className="text-3xl font-serif font-bold mb-6 relative z-10">Study Modes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-yellow-500 mb-3">Physical Classes</h3>
              <p className="text-slate-300">Join us at our Lagos campus for immersive, face-to-face learning, vibrant chapel services, and direct access to our library and faculty.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-yellow-500 mb-3">Online Learning</h3>
              <p className="text-slate-300">Study from anywhere in the world through our interactive online platform. Access lectures, submit assignments, and engage with peers virtually.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Modal */}
      {selectedProgramme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedProgramme.title}</h2>
                <p className="text-slate-500 mt-1">Course Outline & Curriculum</p>
              </div>
              <button 
                onClick={() => setSelectedProgramme(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProgramme.courses?.map((course: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                        {course.code}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 text-sm leading-tight">{course.title}</h3>
                    <p className="text-slate-600 text-sm mb-3">{course.description}</p>
                    {course.ref && (
                      <div className="flex items-center text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                        <Book size={14} className="mr-1.5 text-slate-400" />
                        <span className="font-medium">Ref:</span> <span className="ml-1 italic">{course.ref}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
              <button 
                onClick={() => setSelectedProgramme(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
