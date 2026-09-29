import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";
import {
  downloadSectionPDF,
  downloadCompletePDF,
  downloadCompleteWord,
  downloadCompletePPT,
} from "./downloadUtils";
const API_BASE_URL = "http://127.0.0.1:8000"; 
function App() { 
  const [youtubeUrl, setYoutubeUrl] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [studyMaterial, setStudyMaterial] = useState(null); 
  const [activeSection, setActiveSection] = useState("content"); 
  const [showAnswers, setShowAnswers] = useState(false); 
  // ===================================================== 
  // AUTHENTICATION STATE 
  // ===================================================== 
  const [user, setUser] = useState( 
    JSON.parse(localStorage.getItem("notetube_user")) || null 
  ); 
  const [token, setToken] = useState( 
    localStorage.getItem("notetube_token") || null 
  ); 
  const [authMode, setAuthMode] = useState(null); 
  const [authLoading, setAuthLoading] = useState(false); 
  const [authForm, setAuthForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
  }); 
  // ===================================================== 
  // HISTORY STATE 
  // ===================================================== 
  const [history, setHistory] = useState([]); 
  const [showHistory, setShowHistory] = useState(false); 
  const [historyLoading, setHistoryLoading] = useState(false); 
  // ===================================================== 
  // OPEN LOGIN MODAL 
  // ===================================================== 
  const openLoginModal = () => { 
    setAuthForm({ 
      name: "", 
      email: "", 
      password: "", 
    }); 
    setAuthMode("login"); 
  }; 
  // ===================================================== 
  // LOAD HISTORY WHEN USER LOGS IN 
  // ===================================================== 
  useEffect(() => { 
    if (token) { 
      loadHistory(); 
    } else { 
      setHistory([]); 
    } 
  }, [token]); 
  // ===================================================== 
  // LOGIN 
  // ===================================================== 
  const handleLogin = async (e) => { 
    e.preventDefault(); 
    if (!authForm.email.trim() || !authForm.password.trim()) { 
      alert("Please enter your email and password."); 
      return; 
    } 
    setAuthLoading(true); 
    try { 
      const response = await fetch( 
        `${API_BASE_URL}/api/auth/login`, 
        { 
          method: "POST", 
          headers: { 
            "Content-Type": "application/json", 
          }, 
          body: JSON.stringify({ 
            email: authForm.email, 
            password: authForm.password, 
          }), 
        } 
      ); 
      const data = await response.json(); 
      if (!response.ok || !data.success) { 
        alert(data.detail || data.message || "Login failed."); 
        return; 
      } 
      localStorage.setItem( 
        "notetube_token", 
        data.access_token 
      ); 
      localStorage.setItem( 
        "notetube_user", 
        JSON.stringify(data.user) 
      ); 
      setToken(data.access_token); 
      setUser(data.user); 
      setAuthMode(null); 
      setAuthForm({ 
        name: "", 
        email: "", 
        password: "", 
      }); 
      alert(`Welcome back, ${data.user.name}!`); 
    } catch (error) { 
      console.error("Login error:", error); 
      alert( 
        "Could not connect to the NoteTube AI backend." 
      ); 
    } finally { 
      setAuthLoading(false); 
    } 
  }; 
  // ===================================================== 
  // SIGN UP 
  // ===================================================== 
  const handleSignup = async (e) => { 
    e.preventDefault(); 
    if ( 
      !authForm.name.trim() || 
      !authForm.email.trim() || 
      !authForm.password.trim() 
    ) { 
      alert("Please fill in all fields."); 
      return; 
    } 
    if (authForm.password.length < 6) { 
      alert("Password must contain at least 6 characters."); 
      return; 
    } 
    setAuthLoading(true); 
    try { 
      const response = await fetch( 
        `${API_BASE_URL}/api/auth/signup`, 
        { 
          method: "POST", 
          headers: { 
            "Content-Type": "application/json", 
          }, 
          body: JSON.stringify({ 
            name: authForm.name, 
            email: authForm.email, 
            password: authForm.password, 
          }), 
        } 
      ); 
      const data = await response.json(); 
      if (!response.ok || !data.success) { 
        alert( 
          data.detail || 
            data.message || 
            "Sign up failed." 
        ); 
        return; 
      } 
      localStorage.setItem( 
        "notetube_token", 
        data.access_token 
      ); 
      localStorage.setItem( 
        "notetube_user", 
        JSON.stringify(data.user) 
      ); 
      setToken(data.access_token); 
      setUser(data.user); 
      setAuthMode(null); 
      setAuthForm({ 
        name: "", 
        email: "", 
        password: "", 
      }); 
      alert( 
        `Account created successfully. Welcome, ${data.user.name}!` 
      ); 
    } catch (error) { 
      console.error("Signup error:", error); 
      alert( 
        "Could not connect to the NoteTube AI backend." 
      ); 
    } finally { 
      setAuthLoading(false); 
    } 
  }; 
  // ===================================================== 
  // LOGOUT 
  // ===================================================== 
  const handleLogout = () => { 
    localStorage.removeItem("notetube_token"); 
    localStorage.removeItem("notetube_user"); 
    setToken(null); 
    setUser(null); 
    setHistory([]); 
    setShowHistory(false); 
    alert("You have been logged out."); 
  }; 
  // ===================================================== 
  // LOAD HISTORY 
  // ===================================================== 
  const loadHistory = async () => { 
    const savedToken = 
      localStorage.getItem("notetube_token"); 
    if (!savedToken) { 
      return; 
    } 
    setHistoryLoading(true); 
    try { 
      const response = await fetch( 
        `${API_BASE_URL}/api/history/`, 
        { 
          method: "GET", 
          headers: { 
            Authorization: `Bearer ${savedToken}`, 
          }, 
        } 
      ); 
      const data = await response.json(); 
      if (!response.ok) { 
        if (response.status === 401) { 
          handleLogout(); 
        } 
        return; 
      } 
      if (data.success) { 
        setHistory(data.history || []); 
      } 
    } catch (error) { 
      console.error( 
        "History loading error:", 
        error 
      ); 
    } finally { 
      setHistoryLoading(false); 
    } 
  }; 
  // ===================================================== 
  // GENERATE STUDY MATERIAL 
  // ===================================================== 
  const handleGenerateNotes = async () => { 
    if (!youtubeUrl.trim()) { 
      alert("Please enter a YouTube URL"); 
      return; 
    } 
    setLoading(true); 
    setStudyMaterial(null); 
    setShowAnswers(false); 
    try { 
      const headers = { 
        "Content-Type": "application/json", 
      }; 
      if (token) { 
        headers.Authorization = `Bearer ${token}`; 
      } 
      const response = await fetch( 
        `${API_BASE_URL}/api/videos/generate-notes`, 
        { 
          method: "POST", 
          headers, 
          body: JSON.stringify({ 
            url: youtubeUrl, 
          }), 
        } 
      ); 
      const data = await response.json(); 
      if (!response.ok || !data.success) { 
        alert( 
          data.message || 
            "Something went wrong while generating study material." 
        ); 
        return; 
      } 
      setStudyMaterial(data.notes); 
      setActiveSection("content"); 
      if (token) { 
        loadHistory(); 
      } 
    } catch (error) { 
      console.error("Error:", error); 
      alert( 
        "Could not connect to the NoteTube AI backend.\n\nMake sure FastAPI is running on port 8000." 
      ); 
    } finally { 
      setLoading(false); 
    } 
  }; 
  // ===================================================== 
  // DOWNLOAD CURRENT SECTION 
  // ===================================================== 
  const handleDownloadSection = ( 
    title, 
    subtitle, 
    data 
  ) => { 
    if (!studyMaterial) { 
      alert( 
        "Please generate study material first." 
      ); 
      return; 
    } 
    if ( 
      !Array.isArray(data) && 
      typeof data !== "string" 
    ) { 
      alert( 
        `No ${title} content is available.` 
      ); 
      return; 
    } 
    if ( 
      Array.isArray(data) && 
      data.length === 0 
    ) { 
      alert( 
        `No ${title} questions are available.` 
      ); 
      return; 
    } 
    downloadSectionPDF({ 
      title, 
      subtitle, 
      data, 
      showAnswers: true, 
      videoTitle: studyMaterial.title, 
    }); 
  }; 
  // ===================================================== 
  // COMPLETE WORKSHEET DOWNLOADS 
  // ===================================================== 
  const handleCompletePDF = () => { 
    if (!studyMaterial) { 
      alert( 
        "Please generate study material first." 
      ); 
      return; 
    } 
    downloadCompletePDF({ 
      studyMaterial, 
    }); 
  }; 
  const handleCompleteWord = async () => { 
    if (!studyMaterial) { 
      alert( 
        "Please generate study material first." 
      ); 
      return; 
    } 
    await downloadCompleteWord({ 
      studyMaterial, 
    }); 
  }; 
  const handleCompletePPT = async () => { 
    if (!studyMaterial) { 
      alert( 
        "Please generate study material first." 
      ); 
      return; 
    } 
    await downloadCompletePPT({ 
      studyMaterial, 
    }); 
  }; 
  // ===================================================== 
  // RENDER LIST 
  // ===================================================== 
  const renderList = (items) => { 
    if (!Array.isArray(items)) return null; 
    return ( 
      <div className="content-list"> 
        {items.map((item, index) => ( 
          <div 
            className="content-card" 
            key={index} 
          > 
            {typeof item === "string" ? ( 
              <ReactMarkdown> 
                {item} 
              </ReactMarkdown> 
            ) : ( 
              <> 
                {item.question && ( 
                  <h3> 
                    Q{index + 1}.{" "} 
                    <ReactMarkdown> 
                      {item.question} 
                    </ReactMarkdown> 
                  </h3> 
                )} 
                {item.term && ( 
                  <div className="term-content"> 
                    <h4> 
                      <ReactMarkdown> 
                        {item.term} 
                      </ReactMarkdown> 
                    </h4> 
                    {item.definition && ( 
                      <ReactMarkdown> 
                        {item.definition} 
                      </ReactMarkdown> 
                    )} 
                  </div> 
                )} 
                {item.concept && ( 
                  <div className="term-content"> 
                    <h4> 
                      <ReactMarkdown> 
                        {item.concept} 
                      </ReactMarkdown> 
                    </h4> 
                    {item.description && ( 
                      <ReactMarkdown> 
                        {item.description} 
                      </ReactMarkdown> 
                    )} 
                  </div> 
                )} 
                {item.options && ( 
                  <div className="mcq-options"> 
                    {item.options.map( 
                      ( 
                        option, 
                        optionIndex 
                      ) => ( 
                        <div 
                          key={ 
                            optionIndex 
                          } 
                        > 
                          <strong> 
                            {String.fromCharCode( 
                              65 + 
                                optionIndex 
                            )} 
                            . 
                          </strong>{" "} 
                          <ReactMarkdown> 
                            {option} 
                          </ReactMarkdown> 
                        </div> 
                      ) 
                    )} 
                  </div> 
                )} 
                {showAnswers && 
                  item.answer && ( 
                    <div className="answer-box"> 
                      <strong> 
                        Answer: 
                      </strong> 
                      <ReactMarkdown> 
                        {item.answer} 
                      </ReactMarkdown> 
                    </div> 
                  )} 
              </> 
            )} 
          </div> 
        ))} 
      </div> 
    ); 
  }; 
  // ===================================================== 
  // CONTENT SECTION 
  // ===================================================== 
  const renderContentSection = () => { 
    if (!studyMaterial) return null; 
    return ( 
      <div className="study-content"> 
        <div className="study-header"> 
          <p className="small-title"> 
            AI GENERATED STUDY MATERIAL 
          </p> 
          <h2> 
            {studyMaterial.title} 
          </h2> 
          <div className="study-overview"> 
            <ReactMarkdown> 
              {studyMaterial.overview || ""} 
            </ReactMarkdown> 
          </div> 
        </div> 
        {activeSection === "content" && ( 
          <div className="material-section"> 
            <h2> 
              📚 Detailed Content 
            </h2> 
            <div className="text-card"> 
              <ReactMarkdown> 
                {studyMaterial.detailed_content || 
                  ""} 
              </ReactMarkdown> 
            </div> 
            {Array.isArray( 
              studyMaterial.key_concepts 
            ) && 
              studyMaterial.key_concepts.length > 
                0 && ( 
                <> 
                  <h2> 
                    🔑 Key Concepts 
                  </h2> 
                  {renderList( 
                    studyMaterial.key_concepts 
                  )} 
                </> 
              )} 
            {Array.isArray( 
              studyMaterial.definitions 
            ) && 
              studyMaterial.definitions.length > 
                0 && ( 
                <> 
                  <h2> 
                    📖 Definitions 
                  </h2> 
                  {renderList( 
                    studyMaterial.definitions 
                  )} 
                </> 
              )} 
            {Array.isArray( 
              studyMaterial.examples 
            ) && 
              studyMaterial.examples.length > 
                0 && ( 
                <> 
                  <h2> 
                    💡 Examples 
                  </h2> 
                  {renderList( 
                    studyMaterial.examples 
                  )} 
                </> 
              )} 
            {Array.isArray( 
              studyMaterial.important_points 
            ) && 
              studyMaterial.important_points.length > 
                0 && ( 
                <> 
                  <h2> 
                    ⭐ Important Points 
                  </h2> 
                  {renderList( 
                    studyMaterial.important_points 
                  )} 
                </> 
              )} 
          </div> 
        )} 
        {activeSection === "vsaq" && ( 
          <QuestionSection 
            title="VSAQ" 
            subtitle="Very Short Answer Questions" 
            data={studyMaterial.vsaq} 
            showAnswers={showAnswers} 
            setShowAnswers={setShowAnswers} 
            renderList={renderList} 
            onDownload={() => 
              handleDownloadSection( 
                "VSAQ", 
                "Very Short Answer Questions", 
                studyMaterial.vsaq 
              ) 
            } 
          /> 
        )} 
        {activeSection === "saq" && ( 
          <QuestionSection 
            title="SAQ" 
            subtitle="Short Answer Questions" 
            data={studyMaterial.saq} 
            showAnswers={showAnswers} 
            setShowAnswers={setShowAnswers} 
            renderList={renderList} 
            onDownload={() => 
              handleDownloadSection( 
                "SAQ", 
                "Short Answer Questions", 
                studyMaterial.saq 
              ) 
            } 
          /> 
        )} 
        {activeSection === "laq" && ( 
          <QuestionSection 
            title="LAQ" 
            subtitle="Long Answer Questions" 
            data={studyMaterial.laq} 
            showAnswers={showAnswers} 
            setShowAnswers={setShowAnswers} 
            renderList={renderList} 
            onDownload={() => 
              handleDownloadSection( 
                "LAQ", 
                "Long Answer Questions", 
                studyMaterial.laq 
              ) 
            } 
          /> 
        )} 
        {activeSection === "mcq" && ( 
          <QuestionSection 
            title="MCQ" 
            subtitle="Multiple Choice Questions" 
            data={studyMaterial.mcq} 
            showAnswers={showAnswers} 
            setShowAnswers={setShowAnswers} 
            renderList={renderList} 
            onDownload={() => 
              handleDownloadSection( 
                "MCQ", 
                "Multiple Choice Questions", 
                studyMaterial.mcq 
              ) 
            } 
          /> 
        )} 
        {activeSection === "fill" && ( 
          <QuestionSection 
            title="Fill in the Blanks" 
            subtitle="Complete the following questions" 
            data={ 
              studyMaterial.fill_in_the_blanks 
            } 
            showAnswers={showAnswers} 
            setShowAnswers={setShowAnswers} 
            renderList={renderList} 
            onDownload={() => 
              handleDownloadSection( 
                "Fill-in-the-Blanks", 
                "Complete the following questions", 
                studyMaterial.fill_in_the_blanks 
              ) 
            } 
          /> 
        )} 
        {activeSection === "revision" && ( 
          <div className="material-section"> 
            <div className="question-heading"> 
              <div> 
                <h2> 
                  🧠 Quick Revision Cheat Sheet 
                </h2> 
                <p> 
                  Important points for quick 
                  exam revision. 
                </p> 
              </div> 
              <button 
                className="pdf-btn" 
                onClick={() => 
                  handleDownloadSection( 
                    "Quick-Revision", 
                    "Quick Revision Cheat Sheet", 
                    studyMaterial.quick_revision 
                  ) 
                } 
              > 
                📄 Download PDF 
              </button> 
            </div> 
            <div className="revision-card"> 
              {Array.isArray( 
                studyMaterial.quick_revision 
              ) ? ( 
                <ul> 
                  {studyMaterial.quick_revision.map( 
                    ( 
                      point, 
                      index 
                    ) => ( 
                      <li key={index}> 
                        <ReactMarkdown> 
                          {point} 
                        </ReactMarkdown> 
                      </li> 
                    ) 
                  )} 
                </ul> 
              ) : ( 
                <ReactMarkdown> 
                  {studyMaterial.quick_revision || 
                    ""} 
                </ReactMarkdown> 
              )} 
            </div> 
          </div> 
        )} 
      </div> 
    ); 
  }; 
  // ===================================================== 
  // HISTORY VIEW 
  // ===================================================== 
  const renderHistory = () => { 
    if (!showHistory) return null; 
    return ( 
      <div className="history-panel"> 
        <div className="history-header"> 
          <div> 
            <p className="small-title"> 
              YOUR ACTIVITY 
            </p> 
            <h2> 
              Search History 
            </h2> 
            <p> 
              Your generated learning materials 
              will appear here. 
            </p> 
          </div> 
          <button 
            className="answer-btn" 
            onClick={() => 
              setShowHistory(false) 
            } 
          > 
            ✕ Close 
          </button> 
        </div> 
        {historyLoading ? ( 
          <div className="text-card"> 
            Loading history... 
          </div> 
        ) : history.length === 0 ? ( 
          <div className="text-card"> 
            <h3> 
              No history yet 
            </h3> 
            <p> 
              Generate study material from a 
              YouTube video and your activity 
              will appear here. 
            </p> 
          </div> 
        ) : ( 
          <div className="content-list"> 
            {history.map((item) => ( 
              <div 
                className="content-card" 
                key={item.id} 
              > 
                <h3> 
                  {item.video_title || 
                    "YouTube Video"} 
                </h3> 
                <p> 
                  {item.video_url} 
                </p> 
                {item.created_at && ( 
                  <small> 
                    {new Date( 
                      item.created_at 
                    ).toLocaleString()} 
                  </small> 
                )} 
                <div 
                  style={{ 
                    marginTop: "12px", 
                  }} 
                > 
                  <a 
                    href={item.video_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="pdf-btn" 
                  > 
                    ▶ Open Video 
                  </a> 
                </div> 
              </div> 
            ))} 
          </div> 
        )} 
      </div> 
    ); 
  }; 
  return ( 
    <div className="app"> 
      {/* ================================================= 
          NAVBAR 
      ================================================= */} 
      <nav className="navbar"> 
        <div className="logo"> 
          <span className="logo-icon"> 
            ▶ 
          </span> 
          <span> 
            NoteTube{" "} 
            <strong>AI</strong> 
          </span> 
        </div> 
        <div className="nav-links"> 
          <a href="#features"> 
            Features 
          </a> 
          <a href="#how-it-works"> 
            How it works 
          </a> 
          {user ? ( 
            <> 
              <button 
                type="button" 
                className="signin-btn" 
                onClick={() => { 
                  setShowHistory(true); 
                  loadHistory(); 
                }} 
              > 
                📚 History 
              </button> 
              <span 
                style={{ 
                  fontWeight: "600", 
                }} 
              > 
                Hi, {user.name} 
              </span> 
              <button 
                type="button" 
                className="signin-btn" 
                onClick={handleLogout} 
              > 
                Logout 
              </button> 
            </> 
          ) : ( 
            <button 
              type="button" 
              className="signin-btn" 
              onClick={openLoginModal} 
            > 
              Sign In 
            </button> 
          )} 
        </div> 
      </nav> 
      <main> 
        {/* ================================================= 
            HERO 
        ================================================= */} 
        <section className="hero"> 
          <div className="badge"> 
            ✨ AI-Powered Video Learning 
          </div> 
          <h1> 
            Turn Videos Into 
            <span> 
              {" "} 
              Knowledge. 
            </span> 
          </h1> 
          <p className="hero-description"> 
            Paste a YouTube video and let 
            NoteTube AI transform it into 
            detailed study material, exam 
            questions and revision content. 
          </p> 
          <div className="url-box"> 
            <div className="input-wrapper"> 
              <span className="link-icon"> 
                🔗 
              </span> 
              <input 
                type="text" 
                value={youtubeUrl} 
                onChange={(e) => 
                  setYoutubeUrl( 
                    e.target.value 
                  ) 
                } 
                placeholder="Paste your YouTube video URL here..." 
                onKeyDown={(e) => { 
                  if (e.key === "Enter") { 
                    handleGenerateNotes(); 
                  } 
                }} 
              /> 
            </div> 
            <button 
              className="generate-btn" 
              onClick={ 
                handleGenerateNotes 
              } 
              disabled={loading} 
            > 
              {loading 
                ? "Generating..." 
                : "Generate Study Material"} 
              {!loading && ( 
                <span> 
                  → 
                </span> 
              )} 
            </button> 
          </div> 
          <p className="helper-text"> 
            {loading 
              ? "AI is analyzing the video transcript and preparing your study material..." 
              : "Paste a YouTube URL to get started"} 
          </p> 
        </section> 
        {/* ================================================= 
            HISTORY 
        ================================================= */} 
        {showHistory && renderHistory()} 
        {/* ================================================= 
            STUDY MATERIAL 
        ================================================= */} 
        {studyMaterial && !showHistory && ( 
          <section className="study-section"> 
            <div className="section-heading"> 
              <p className="small-title"> 
                YOUR STUDY MATERIAL 
              </p> 
              <h2> 
                Learn. Practice.{" "} 
                <span>Revise.</span> 
              </h2> 
              <p> 
                Explore the detailed 
                content and practice 
                questions generated from 
                your video. 
              </p> 
            </div> 
            <div className="study-tabs"> 
              <button 
                className={ 
                  activeSection === 
                  "content" 
                    ? "active" 
                    : "" 
                } 
                onClick={() => { 
                  setActiveSection( 
                    "content" 
                  ); 
                  setShowAnswers(false); 
                }} 
              > 
                📚 Detailed Content 
              </button> 
              <button 
                className={ 
                  activeSection === 
                  "vsaq" 
                    ? "active" 
                    : "" 
                } 
                onClick={() => { 
                  setActiveSection("vsaq"); 
                  setShowAnswers(false); 
                }} 
              > 
                VSAQ 
              </button> 
              <button 
                className={ 
                  activeSection === 
                  "saq" 
                    ? "active" 
                    : "" 
                } 
                onClick={() => { 
                  setActiveSection("saq"); 
                  setShowAnswers(false); 
                }} 
              > 
                SAQ 
              </button> 
              <button 
                className={ 
                  activeSection === 
                  "laq" 
                    ? "active" 
                    : "" 
                } 
                onClick={() => { 
                  setActiveSection("laq"); 
                  setShowAnswers(false); 
                }} 
              > 
                LAQ 
              </button> 
              <button 
                className={ 
                  activeSection === 
                  "mcq" 
                    ? "active" 
                    : "" 
                } 
                onClick={() => { 
                  setActiveSection("mcq"); 
                  setShowAnswers(false); 
                }} 
              > 
                MCQ 
              </button> 
              <button 
                className={ 
                  activeSection === 
                  "fill" 
                    ? "active" 
                    : "" 
                } 
                onClick={() => { 
                  setActiveSection("fill"); 
                  setShowAnswers(false); 
                }} 
              > 
                Fill in the Blanks 
              </button> 
              <button 
                className={ 
                  activeSection === 
                  "revision" 
                    ? "active" 
                    : "" 
                } 
                onClick={() => { 
                  setActiveSection( 
                    "revision" 
                  ); 
                  setShowAnswers(false); 
                }} 
              > 
                🧠 Quick Revision 
              </button> 
            </div> 
            {renderContentSection()} 
            {/* ================================================= 
                COMPLETE WORKSHEET DOWNLOADS 
            ================================================= */} 
            <div className="complete-download-section"> 
              <div className="section-heading"> 
                <p className="small-title"> 
                  COMPLETE WORKSHEET 
                </p> 
                <h2> 
                  Download Your{" "} 
                  <span> 
                    Study Material 
                  </span> 
                </h2> 
                <p> 
                  Download the complete 
                  worksheet in your preferred 
                  format. 
                </p> 
              </div> 
              <div className="download-buttons"> 
                <button 
                  className="pdf-btn" 
                  onClick={ 
                    handleCompletePDF 
                  } 
                > 
                  📄 Download Complete PDF 
                </button> 
                <button 
                  className="pdf-btn" 
                  onClick={ 
                    handleCompleteWord 
                  } 
                > 
                  📝 Download Word 
                </button> 
                <button 
                  className="pdf-btn" 
                  onClick={ 
                    handleCompletePPT 
                  } 
                > 
                  📊 Download PowerPoint 
                </button> 
              </div> 
            </div> 
          </section> 
        )} 
        {/* ================================================= 
            FEATURES 
        ================================================= */} 
        <section 
          className="features" 
          id="features" 
        > 
          <div className="feature-card"> 
            <div className="feature-icon"> 
              📚 
            </div> 
            <h3> 
              Detailed Study Material 
            </h3> 
            <p> 
              Transform long videos into 
              structured, student-friendly 
              learning content. 
            </p> 
          </div> 
          <div className="feature-card"> 
            <div className="feature-icon"> 
              ❓ 
            </div> 
            <h3> 
              Exam Questions 
            </h3> 
            <p> 
              Practice VSAQ, SAQ, LAQ, 
              MCQs and fill-in-the-blank 
              questions. 
            </p> 
          </div> 
          <div className="feature-card"> 
            <div className="feature-icon"> 
              📄 
            </div> 
            <h3> 
              PDF Export 
            </h3> 
            <p> 
              Download individual sections 
              and complete study material 
              as professional PDFs. 
            </p> 
          </div> 
          <div className="feature-card"> 
            <div className="feature-icon"> 
              🧠 
            </div> 
            <h3> 
              Quick Revision 
            </h3> 
            <p> 
              Revise important concepts 
              quickly before exams. 
            </p> 
          </div> 
        </section> 
        {/* ================================================= 
            HOW IT WORKS 
        ================================================= */} 
        <section 
          className="how-section" 
          id="how-it-works" 
        > 
          <div className="section-heading"> 
            <p className="small-title"> 
              HOW IT WORKS 
            </p> 
            <h2> 
              From video to 
              <span> 
                {" "} 
                understanding. 
              </span> 
            </h2> 
            <p> 
              Three simple steps to 
              transform a long video into 
              useful study material. 
            </p> 
          </div> 
          <div className="steps"> 
            <div className="step"> 
              <div className="step-number"> 
                01 
              </div> 
              <h3> 
                Paste 
              </h3> 
              <p> 
                Paste the YouTube video 
                link. 
              </p> 
            </div> 
            <div className="step"> 
              <div className="step-number"> 
                02 
              </div> 
              <h3> 
                Analyze 
              </h3> 
              <p> 
                AI analyzes the video 
                transcript. 
              </p> 
            </div> 
            <div className="step"> 
              <div className="step-number"> 
                03 
              </div> 
              <h3> 
                Learn 
              </h3> 
              <p> 
                Study, practice and 
                revise. 
              </p> 
            </div> 
          </div> 
        </section> 
      </main> 
      {/* ================================================= 
          FOOTER 
      ================================================= */} 
      <footer> 
        <div className="footer-logo"> 
          ▶ NoteTube AI 
        </div> 
        <p> 
          Paste a video. Get the 
          knowledge. 
        </p> 
      </footer> 
      {/* ================================================= 
          AUTH MODAL 
      ================================================= */} 
      {authMode !== null && ( 
        <div 
          className="auth-overlay" 
          style={{ 
            position: "fixed", 
            inset: 0, 
            width: "100%", 
            height: "100%", 
            background: "rgba(0, 0, 0, 0.65)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 99999, 
            padding: "20px", 
            boxSizing: "border-box", 
          }} 
          onClick={() => setAuthMode(null)} 
        > 
          <div 
            className="auth-modal" 
            style={{ 
              position: "relative", 
              width: "100%", 
              maxWidth: "430px", 
              background: "#ffffff", 
              borderRadius: "20px", 
              padding: "35px", 
              boxSizing: "border-box", 
              boxShadow: 
                "0 25px 70px rgba(0,0,0,0.25)", 
              zIndex: 100000, 
            }} 
            onClick={(e) => 
              e.stopPropagation() 
            } 
          > 
            {/* CLOSE BUTTON */} 
            <button 
              type="button" 
              className="auth-close" 
              style={{ 
                position: "absolute", 
                top: "15px", 
                right: "15px", 
                width: "36px", 
                height: "36px", 
                border: "none", 
                borderRadius: "50%", 
                background: "#f3f4f6", 
                cursor: "pointer", 
                fontSize: "18px", 
              }} 
              onClick={() => 
                setAuthMode(null) 
              } 
            > 
              ✕ 
            </button> 
            {/* LOGO */} 
            <div 
              className="auth-logo" 
              style={{ 
                fontSize: "24px", 
                fontWeight: "700", 
                marginBottom: "15px", 
              }} 
            > 
              ▶ NoteTube{" "} 
              <strong>AI</strong> 
            </div> 
            {/* TITLE */} 
            <h2 
              style={{ 
                marginBottom: "8px", 
              }} 
            > 
              {authMode === "login" 
                ? "Welcome Back" 
                : "Create Your Account"} 
            </h2> 
            {/* DESCRIPTION */} 
            <p 
              style={{ 
                color: "#6b7280", 
                marginBottom: "25px", 
                lineHeight: "1.5", 
              }} 
            > 
              {authMode === "login" 
                ? "Log in to access your learning history." 
                : "Create an account to save your learning journey."} 
            </p> 
            {/* FORM */} 
            <form 
              onSubmit={ 
                authMode === "login" 
                  ? handleLogin 
                  : handleSignup 
              } 
            > 
              {/* NAME */} 
              {authMode === "signup" && ( 
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={authForm.name} 
                  onChange={(e) => 
                    setAuthForm({ 
                      ...authForm, 
                      name: e.target.value, 
                    }) 
                  } 
                  style={{ 
                    width: "100%", 
                    padding: "13px 14px", 
                    marginBottom: "12px", 
                    border: 
                      "1px solid #d1d5db", 
                    borderRadius: "10px", 
                    fontSize: "15px", 
                    boxSizing: "border-box", 
                    outline: "none", 
                  }} 
                /> 
              )} 
              {/* EMAIL */} 
              <input 
                type="email" 
                placeholder="Email Address" 
                value={authForm.email} 
                onChange={(e) => 
                  setAuthForm({ 
                    ...authForm, 
                    email: e.target.value, 
                  }) 
                } 
                style={{ 
                  width: "100%", 
                  padding: "13px 14px", 
                  marginBottom: "12px", 
                  border: 
                    "1px solid #d1d5db", 
                  borderRadius: "10px", 
                  fontSize: "15px", 
                  boxSizing: "border-box", 
                  outline: "none", 
                }} 
              /> 
              {/* PASSWORD */} 
              <input 
                type="password" 
                placeholder="Password" 
                value={authForm.password} 
                onChange={(e) => 
                  setAuthForm({ 
                    ...authForm, 
                    password: e.target.value, 
                  }) 
                } 
                style={{ 
                  width: "100%", 
                  padding: "13px 14px", 
                  marginBottom: "18px", 
                  border: 
                    "1px solid #d1d5db", 
                  borderRadius: "10px", 
                  fontSize: "15px", 
                  boxSizing: "border-box", 
                  outline: "none", 
                }} 
              /> 
              {/* SUBMIT BUTTON */} 
              <button 
                type="submit" 
                className="generate-btn auth-submit" 
                disabled={authLoading} 
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  border: "none", 
                  borderRadius: "10px", 
                  cursor: authLoading 
                    ? "not-allowed" 
                    : "pointer", 
                  fontSize: "16px", 
                  fontWeight: "600", 
                }} 
              > 
                {authLoading 
                  ? "Please wait..." 
                  : authMode === "login" 
                  ? "Log In" 
                  : "Create Account"} 
              </button> 
            </form> 
            {/* LOGIN / SIGNUP SWITCH */} 
            <div 
              className="auth-switch" 
              style={{ 
                textAlign: "center", 
                marginTop: "22px", 
                color: "#6b7280", 
                fontSize: "14px", 
              }} 
            > 
              {authMode === "login" ? ( 
                <> 
                  Don't have an account?{" "} 
                  <button 
                    type="button" 
                    onClick={() => { 
                      setAuthMode("signup"); 
                      setAuthForm({ 
                        name: "", 
                        email: "", 
                        password: "", 
                      }); 
                    }} 
                    style={{ 
                      border: "none", 
                      background: "none", 
                      color: "#4f46e5", 
                      fontWeight: "600", 
                      cursor: "pointer", 
                      padding: 0, 
                    }} 
                  > 
                    Sign Up 
                  </button> 
                </> 
              ) : ( 
                <> 
                  Already have an account?{" "} 
                  <button 
                    type="button" 
                    onClick={() => { 
                      setAuthMode("login"); 
                      setAuthForm({ 
                        name: "", 
                        email: "", 
                        password: "", 
                      }); 
                    }} 
                    style={{ 
                      border: "none", 
                      background: "none", 
                      color: "#4f46e5", 
                      fontWeight: "600", 
                      cursor: "pointer", 
                      padding: 0, 
                    }} 
                  > 
                    Log In 
                  </button> 
                </> 
              )} 
            </div> 
          </div> 
        </div> 
      )} 
    </div> 
  ); 
} 
/* ===================================================== 
   QUESTION SECTION 
===================================================== */ 
function QuestionSection({ 
  title, 
  subtitle, 
  data, 
  showAnswers, 
  setShowAnswers, 
  renderList, 
  onDownload, 
}) { 
  return ( 
    <div className="material-section"> 
      <div className="question-heading"> 
        <div> 
          <h2> 
            {title} 
          </h2> 
          <p> 
            {subtitle} 
          </p> 
        </div> 
        <div className="question-actions"> 
          <button 
            className="answer-btn" 
            onClick={() => 
              setShowAnswers( 
                !showAnswers 
              ) 
            } 
          > 
            {showAnswers 
              ? "🙈 Hide Answers" 
              : "👁 Show Answers"} 
          </button> 
          <button 
            className="pdf-btn" 
            onClick={onDownload} 
          > 
            📄 Download PDF 
          </button> 
        </div> 
      </div> 
      <div className="question-count"> 
        {Array.isArray(data) 
          ? `${data.length} questions` 
          : ""} 
      </div> 
      {renderList(data)} 
    </div> 
  ); 
} 
export default App; 