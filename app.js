const STORAGE_KEY = 'resumeLeaderData';
const TEMPLATE_KEY = 'selectedTemplate';
// Safe Storage Wrapper to handle browser security sandboxing (e.g. file:// URLs)
window.safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.getItem is blocked or unavailable:', e);
      return this._memory[key] || null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage.setItem is blocked or unavailable:', e);
      this._memory[key] = value;
    }
  },
  _memory: {}
};
// Premium Sample Data
const sampleData = {
  personal: {
    fullName: 'Harirathipa R',
    email: 'prathipa296@gmail.com',
    phone: '+91 98765 43210',
    linkedin: 'https://linkedin.com/in/harirathipa-r'
  },
  education: [
    {
      degree: 'Bachelor of Engineering in Computer Science',
      school: 'Anna University',
      year: '2020 - 2024',
      details: 'Graduated with First Class Honors. Specialized in Software Engineering and Web Architecture.'
    }
  ],
  experience: [
    {
      role: 'Junior Web Developer',
      company: 'Digital Heroes Co.',
      date: '2024 - Present',
      desc: 'Developed responsive, high-performance web applications using semantic HTML, pure CSS, and modern JavaScript. Optimized website assets resulting in a 25% decrease in load times. Collaborated with UI/UX designers to translate Figma mockups into interactive templates.'
    },
    {
      role: 'Web Development Intern',
      company: 'Tech Solutions Inc.',
      date: '2023 - 2024',
      desc: 'Assisted in building custom client landing pages. Maintained existing codebase, resolved cross-browser compatibility issues, and integrated public APIs.'
    }
  ],
  projects: [
    {
      title: 'ResumeLeader AI Web App',
      tech: 'HTML, CSS, JavaScript, Vercel',
      desc: 'Designed and engineered an ATS-friendly resume builder with client-side state storage, dynamic form layouts, and high-fidelity PDF export features.'
    }
  ],
  skills: 'HTML5, CSS3, JavaScript (ES6+), Responsive Web Design, Git, UI/UX Design, REST APIs, Vercel Deployments',
  certifications: [
    {
      name: 'Certified JavaScript Web Specialist',
      issuer: 'W3 Schools Academy',
      date: '2025'
    }
  ]
};
// Global State
let resumeData = {};
/**
 * 1. Initialize State
 */
function initState() {
  const saved = safeStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      resumeData = JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing stored resume data, loading sample data.', e);
      resumeData = JSON.parse(JSON.stringify(sampleData));
    }
  } else {
    // Fresh user, load beautiful sample data immediately
    resumeData = JSON.parse(JSON.stringify(sampleData));
    saveToStorage();
  }
  // Ensure default template is set
  if (!safeStorage.getItem(TEMPLATE_KEY)) {
    safeStorage.setItem(TEMPLATE_KEY, 'ats');
  }
}
function saveToStorage() {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
}
/**
 * 2. Form Wizard Navigation (Only runs on form.html)
 */
function initFormWizard() {
  const form = document.getElementById('resume-builder-form');
  if (!form) return;
  const sidebarItems = document.querySelectorAll('#form-tab-menu .menu-item');
  const sections = document.querySelectorAll('.form-step-content');
  const sectionTitleLabel = document.getElementById('section-title-label');
  const btnPrev = document.getElementById('btn-prev-step');
  const btnNext = document.getElementById('btn-next-step');
  const btnSubmit = document.getElementById('btn-submit-preview');
  const btnBackTemplates = document.getElementById('btn-back-templates');
  let activeIndex = 0;
  // Set badge for current template selection
  const templateBadge = document.getElementById('selected-template-badge');
  if (templateBadge) {
    const currentTemplate = safeStorage.getItem(TEMPLATE_KEY) || 'ats';
    templateBadge.textContent = `Template: ${currentTemplate.toUpperCase()}`;
  }
  function updateWizardUI() {
    // Remove active state from menu items and sections
    sidebarItems.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('active');
        sections[idx].classList.add('active');
        sectionTitleLabel.textContent = item.querySelector('button').textContent;
      } else {
        item.classList.remove('active');
        sections[idx].classList.remove('active');
      }
    });
    // Control navigation buttons visibility
    if (activeIndex === 0) {
      btnPrev.style.display = 'none';
      btnBackTemplates.style.display = 'inline-flex';
    } else {
      btnPrev.style.display = 'inline-flex';
      btnBackTemplates.style.display = 'none';
    }
    if (activeIndex === sidebarItems.length - 1) {
      btnNext.style.display = 'none';
      btnSubmit.style.display = 'inline-flex';
    } else {
      btnNext.style.display = 'inline-flex';
      btnSubmit.style.display = 'none';
    }
  }
  // Tab click handlers
  sidebarItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
      saveFormData(); // Save current fields before changing tab
      activeIndex = idx;
      updateWizardUI();
    });
  });
  // Next Step Action
  btnNext.addEventListener('click', () => {
    if (activeIndex < sidebarItems.length - 1) {
      saveFormData();
      activeIndex++;
      updateWizardUI();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  // Prev Step Action
  btnPrev.addEventListener('click', () => {
    if (activeIndex > 0) {
      saveFormData();
      activeIndex--;
      updateWizardUI();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  // Populate data into inputs
  loadDataIntoForm();
  // Attach dynamic section builders
  setupDynamicFormSection('education', 'btn-add-education', 'education-list-container', createEducationRowHTML);
  setupDynamicFormSection('experience', 'btn-add-experience', 'experience-list-container', createExperienceRowHTML);
  setupDynamicFormSection('projects', 'btn-add-project', 'projects-list-container', createProjectRowHTML);
  setupDynamicFormSection('certifications', 'btn-add-certification', 'certifications-list-container', createCertificationRowHTML);
  // Form submit (Save & Go to Preview)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveFormData();
    window.location.href = 'preview.html';
  });
  // Setup auto-save listener on inputs
  form.addEventListener('input', debounce(saveFormData, 1000));
}
/**
 * Debounce function to prevent constant disk writes
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
/**
 * 3. Dynamic Form Field Adders / Removers
 */
function setupDynamicFormSection(key, btnId, containerId, rowHtmlFunc) {
  const container = document.getElementById(containerId);
  const btnAdd = document.getElementById(btnId);
  if (!container || !btnAdd) return;
  // Render existing records
  const records = resumeData[key] || [];
  container.innerHTML = '';
  records.forEach((record, index) => {
    container.insertAdjacentHTML('beforeend', rowHtmlFunc(index, record));
  });
  // Click Add More
  btnAdd.removeEventListener('click', btnAdd._listener); // Avoid duplicate bindings
  btnAdd._listener = () => {
    const nextIndex = container.children.length;
    container.insertAdjacentHTML('beforeend', rowHtmlFunc(nextIndex, {}));
    saveFormData(); // Save initial blank state
  };
  btnAdd.addEventListener('click', btnAdd._listener);
  // Event delegation for removals
  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-btn');
    if (removeBtn) {
      const item = removeBtn.closest('.dynamic-item');
      if (item) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        setTimeout(() => {
          item.remove();
          // Re-index remaining inputs
          reindexDynamicInputs(container, key);
          saveFormData();
        }, 200);
      }
    }
  });
}
function reindexDynamicInputs(container, key) {
  const items = container.querySelectorAll('.dynamic-item');
  items.forEach((item, index) => {
    // Update data-index attribute
    item.setAttribute('data-index', index);
    // Update labels/numbers
    const title = item.querySelector('.dynamic-item-title');
    if (title) {
      title.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)} #${index + 1}`;
    }
    
    // Update attribute names to reflect new index
    const inputs = item.querySelectorAll('[name]');
    inputs.forEach(input => {
      const fieldName = input.getAttribute('name').split('-')[0];
      input.setAttribute('name', `${fieldName}-${index}`);
      input.setAttribute('id', `${key}-${fieldName}-${index}`);
    });
  });
}
// Sub-templates for dynamic form rows
function createEducationRowHTML(index, data = {}) {
  return `
    <div class="dynamic-item" data-index="${index}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">Education #${index + 1}</span>
        <button type="button" class="remove-btn">Remove</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>School / University</label>
          <input type="text" name="school-${index}" id="education-school-${index}" class="form-control" placeholder="e.g. Stanford University" value="${data.school || ''}" required>
        </div>
        <div class="form-group">
          <label>Degree / Major</label>
          <input type="text" name="degree-${index}" id="education-degree-${index}" class="form-control" placeholder="e.g. B.S. in Computer Science" value="${data.degree || ''}" required>
        </div>
        <div class="form-group">
          <label>Graduation Year or Date Range</label>
          <input type="text" name="year-${index}" id="education-year-${index}" class="form-control" placeholder="e.g. 2018 - 2022" value="${data.year || ''}" required>
        </div>
        <div class="form-group">
          <label>Additional details (GPA, Honors, etc.)</label>
          <input type="text" name="details-${index}" id="education-details-${index}" class="form-control" placeholder="e.g. GPA 3.9/4.0, Magna Cum Laude" value="${data.details || ''}">
        </div>
      </div>
    </div>
  `;
}
function createExperienceRowHTML(index, data = {}) {
  return `
    <div class="dynamic-item" data-index="${index}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">Work Experience #${index + 1}</span>
        <button type="button" class="remove-btn">Remove</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" name="company-${index}" id="experience-company-${index}" class="form-control" placeholder="e.g. Google" value="${data.company || ''}" required>
        </div>
        <div class="form-group">
          <label>Job Title / Role</label>
          <input type="text" name="role-${index}" id="experience-role-${index}" class="form-control" placeholder="e.g. Software Engineer" value="${data.role || ''}" required>
        </div>
        <div class="form-group full-width">
          <label>Date Range (Start - End)</label>
          <input type="text" name="date-${index}" id="experience-date-${index}" class="form-control" placeholder="e.g. Jan 2021 - Present" value="${data.date || ''}" required>
        </div>
        <div class="form-group full-width">
          <label>Description & Core Accomplishments</label>
          <textarea name="desc-${index}" id="experience-desc-${index}" class="form-control" placeholder="Describe key accomplishments, metrics achieved, technologies used..." rows="4" required>${data.desc || ''}</textarea>
        </div>
      </div>
    </div>
  `;
}
function createProjectRowHTML(index, data = {}) {
  return `
    <div class="dynamic-item" data-index="${index}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">Project #${index + 1}</span>
        <button type="button" class="remove-btn">Remove</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Project Title</label>
          <input type="text" name="title-${index}" id="projects-title-${index}" class="form-control" placeholder="e.g. E-Commerce Platform" value="${data.title || ''}" required>
        </div>
        <div class="form-group">
          <label>Technologies Used / Link</label>
          <input type="text" name="tech-${index}" id="projects-tech-${index}" class="form-control" placeholder="e.g. React, Node.js, Vercel" value="${data.tech || ''}">
        </div>
        <div class="form-group full-width">
          <label>Short Description</label>
          <textarea name="desc-${index}" id="projects-desc-${index}" class="form-control" placeholder="Describe what you built and how it addresses a real-world problem..." rows="3" required>${data.desc || ''}</textarea>
        </div>
      </div>
    </div>
  `;
}
function createCertificationRowHTML(index, data = {}) {
  return `
    <div class="dynamic-item" data-index="${index}">
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">Certification #${index + 1}</span>
        <button type="button" class="remove-btn">Remove</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Certification Name</label>
          <input type="text" name="name-${index}" id="certifications-name-${index}" class="form-control" placeholder="e.g. AWS Solutions Architect" value="${data.name || ''}" required>
        </div>
        <div class="form-group">
          <label>Issuing Organization</label>
          <input type="text" name="issuer-${index}" id="certifications-issuer-${index}" class="form-control" placeholder="e.g. Amazon Web Services" value="${data.issuer || ''}" required>
        </div>
        <div class="form-group full-width">
          <label>Issue Date</label>
          <input type="text" name="date-${index}" id="certifications-date-${index}" class="form-control" placeholder="e.g. Dec 2024" value="${data.date || ''}" required>
        </div>
      </div>
    </div>
  `;
}
/**
 * 4. Save Form Data to Memory & LocalStorage
 */
function saveFormData() {
  // Check if form is present in DOM
  const form = document.getElementById('resume-builder-form');
  if (!form) return;
  // 1. Personal Details
  resumeData.personal = {
    fullName: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    linkedin: document.getElementById('linkedin').value
  };
  // 2. Education
  resumeData.education = [];
  const eduItems = document.querySelectorAll('#education-list-container .dynamic-item');
  eduItems.forEach(item => {
    const idx = item.getAttribute('data-index');
    resumeData.education.push({
      school: document.getElementById(`education-school-${idx}`).value,
      degree: document.getElementById(`education-degree-${idx}`).value,
      year: document.getElementById(`education-year-${idx}`).value,
      details: document.getElementById(`education-details-${idx}`).value
    });
  });
  // 3. Work Experience
  resumeData.experience = [];
  const expItems = document.querySelectorAll('#experience-list-container .dynamic-item');
  expItems.forEach(item => {
    const idx = item.getAttribute('data-index');
    resumeData.experience.push({
      company: document.getElementById(`experience-company-${idx}`).value,
      role: document.getElementById(`experience-role-${idx}`).value,
      date: document.getElementById(`experience-date-${idx}`).value,
      desc: document.getElementById(`experience-desc-${idx}`).value
    });
  });
  // 4. Projects
  resumeData.projects = [];
  const projItems = document.querySelectorAll('#projects-list-container .dynamic-item');
  projItems.forEach(item => {
    const idx = item.getAttribute('data-index');
    resumeData.projects.push({
      title: document.getElementById(`projects-title-${idx}`).value,
      tech: document.getElementById(`projects-tech-${idx}`).value,
      desc: document.getElementById(`projects-desc-${idx}`).value
    });
  });
  // 5. Skills
  resumeData.skills = document.getElementById('skills-input').value;
  // 6. Certifications
  resumeData.certifications = [];
  const certItems = document.querySelectorAll('#certifications-list-container .dynamic-item');
  certItems.forEach(item => {
    const idx = item.getAttribute('data-index');
    resumeData.certifications.push({
      name: document.getElementById(`certifications-name-${idx}`).value,
      issuer: document.getElementById(`certifications-issuer-${idx}`).value,
      date: document.getElementById(`certifications-date-${idx}`).value
    });
  });
  saveToStorage();
}
/**
 * Load saved details back into inputs on page load
 */
function loadDataIntoForm() {
  if (resumeData.personal) {
    document.getElementById('fullName').value = resumeData.personal.fullName || '';
    document.getElementById('email').value = resumeData.personal.email || '';
    document.getElementById('phone').value = resumeData.personal.phone || '';
    document.getElementById('linkedin').value = resumeData.personal.linkedin || '';
  }
  document.getElementById('skills-input').value = resumeData.skills || '';
}
/**
 * 5. Live Preview Renderer (Only runs on preview.html)
 */
function initPreviewPage() {
  const paper = document.getElementById('resume-document-paper');
  if (!paper) return;
  const selector = document.getElementById('preview-template-selector');
  const downloadBtn = document.getElementById('btn-download-pdf');
  // Load selection and sync active state in options
  let currentTemplate = safeStorage.getItem(TEMPLATE_KEY) || 'ats';
  setActiveTemplateOption(currentTemplate);
  renderPreviewHTML(currentTemplate);
  // Template change events
  if (selector) {
    selector.addEventListener('click', (e) => {
      const option = e.target.closest('.preview-temp-option');
      if (option) {
        currentTemplate = option.getAttribute('data-template');
        safeStorage.setItem(TEMPLATE_KEY, currentTemplate);
        setActiveTemplateOption(currentTemplate);
        renderPreviewHTML(currentTemplate);
      }
    });
  }
  // PDF Download Trigger
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      exportPDF();
    });
  }
}
function setActiveTemplateOption(templateName) {
  const options = document.querySelectorAll('.preview-temp-option');
  options.forEach(opt => {
    if (opt.getAttribute('data-template') === templateName) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}
/**
 * Renders raw data in the selected style framework
 */
function renderPreviewHTML(templateName) {
  const paper = document.getElementById('resume-document-paper');
  if (!paper) return;
  // Clear existing paper and apply template class styles
  paper.className = `resume-paper template-${templateName}`;
  paper.innerHTML = '';
  const { personal, education, experience, projects, skills, certifications } = resumeData;
  const personalInfo = personal || {};
  const eduList = education || [];
  const expList = experience || [];
  const projList = projects || [];
  const certList = certifications || [];
  // Parse skill list
  const skillTags = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (templateName === 'ats') {
    // ==========================================
    // ATS MINIMALIST TEMPLATE GENERATION
    // ==========================================
    let htmlContent = `
      <div class="cv-header">
        <h1 class="cv-name">${personalInfo.fullName || 'Your Name'}</h1>
        <div class="cv-contact">
          ${personalInfo.email ? `<span>Email: ${personalInfo.email}</span>` : ''}
          ${personalInfo.phone ? `<span>Phone: ${personalInfo.phone}</span>` : ''}
          ${personalInfo.linkedin ? `<span>LinkedIn: ${personalInfo.linkedin}</span>` : ''}
        </div>
      </div>
    `;
    // Experience Section
    if (expList.length > 0) {
      htmlContent += `
        <div class="cv-section">
          <h2 class="cv-section-title">Professional Experience</h2>
          ${expList.map(exp => `
            <div class="cv-item">
              <div class="cv-item-header">
                <span>${exp.company}</span>
                <span>${exp.date}</span>
              </div>
              <div class="cv-item-sub">
                <span>${exp.role}</span>
              </div>
              <div class="cv-item-desc">${exp.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    // Projects Section
    if (projList.length > 0) {
      htmlContent += `
        <div class="cv-section">
          <h2 class="cv-section-title">Projects</h2>
          ${projList.map(proj => `
            <div class="cv-item">
              <div class="cv-item-header">
                <span>${proj.title}</span>
                <span style="font-weight: normal; font-size: 12px; color: #666;">${proj.tech || ''}</span>
              </div>
              <div class="cv-item-desc" style="margin-top: 4px;">${proj.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    // Education Section
    if (eduList.length > 0) {
      htmlContent += `
        <div class="cv-section">
          <h2 class="cv-section-title">Education</h2>
          ${eduList.map(edu => `
            <div class="cv-item">
              <div class="cv-item-header">
                <span>${edu.school}</span>
                <span>${edu.year}</span>
              </div>
              <div class="cv-item-sub">
                <span>${edu.degree}</span>
                <span>${edu.details || ''}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    // Skills Section
    if (skillTags.length > 0) {
      htmlContent += `
        <div class="cv-section">
          <h2 class="cv-section-title">Core Skills</h2>
          <div class="cv-skills-grid">
            ${skillTags.map(tag => `<span class="cv-skill-tag">${tag}</span>`).join('')}
          </div>
        </div>
      `;
    }
    // Certifications Section
    if (certList.length > 0) {
      htmlContent += `
        <div class="cv-section">
          <h2 class="cv-section-title">Certifications</h2>
          ${certList.map(cert => `
            <div class="cv-item" style="margin-bottom: 6px;">
              <div class="cv-item-header">
                <span style="font-weight: 600;">${cert.name}</span>
                <span>${cert.date}</span>
              </div>
              <div class="cv-item-sub" style="margin-bottom: 0;">
                <span>${cert.issuer}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    paper.innerHTML = htmlContent;
  } else if (templateName === 'corporate') {
    // ==========================================
    // CORPORATE DUAL-COLUMN SIDEBAR TEMPLATE
    // ==========================================
    let sideColHTML = `
      <div class="side-col">
        <div class="side-header">
          <h1 class="cv-name">${personalInfo.fullName || 'Your Name'}</h1>
        </div>
        
        <div class="side-section">
          <h2 class="side-section-title">Contact</h2>
          <div class="side-contact-list">
            ${personalInfo.email ? `
              <div class="side-contact-item">
                <span class="side-contact-label">Email</span>
                <span>${personalInfo.email}</span>
              </div>` : ''}
            ${personalInfo.phone ? `
              <div class="side-contact-item">
                <span class="side-contact-label">Phone</span>
                <span>${personalInfo.phone}</span>
              </div>` : ''}
            ${personalInfo.linkedin ? `
              <div class="side-contact-item">
                <span class="side-contact-label">LinkedIn</span>
                <span style="word-break: break-all;">${personalInfo.linkedin}</span>
              </div>` : ''}
          </div>
        </div>
    `;
    // Skills on Sidebar
    if (skillTags.length > 0) {
      sideColHTML += `
        <div class="side-section">
          <h2 class="side-section-title">Skills</h2>
          <div>
            ${skillTags.map(tag => `<span class="cv-skill-tag">${tag}</span>`).join('')}
          </div>
        </div>
      `;
    }
    // Education on Sidebar
    if (eduList.length > 0) {
      sideColHTML += `
        <div class="side-section">
          <h2 class="side-section-title">Education</h2>
          ${eduList.map(edu => `
            <div style="font-size: 12px; margin-bottom: 12px;">
              <div style="font-weight: 700; color: #93c5fd;">${edu.degree}</div>
              <div style="font-weight: 500;">${edu.school}</div>
              <div style="color: #cbd5e1; font-size: 11px;">${edu.year}</div>
              ${edu.details ? `<div style="color: #cbd5e1; font-style: italic; font-size: 11px; margin-top: 2px;">${edu.details}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }
    sideColHTML += `</div>`; // Close side-col
    // Main Column
    let mainColHTML = `
      <div class="main-col">
    `;
    // Experience Section
    if (expList.length > 0) {
      mainColHTML += `
        <div>
          <h2 class="main-section-title">Work Experience</h2>
          ${expList.map(exp => `
            <div class="cv-item">
              <div class="cv-item-header">
                <span>${exp.company}</span>
                <span style="font-weight: normal; font-size: 12px; color: #64748b;">${exp.date}</span>
              </div>
              <div class="cv-item-sub">
                <span>${exp.role}</span>
              </div>
              <div class="cv-item-desc">${exp.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    // Projects Section
    if (projList.length > 0) {
      mainColHTML += `
        <div>
          <h2 class="main-section-title">Key Projects</h2>
          ${projList.map(proj => `
            <div class="cv-item">
              <div class="cv-item-header">
                <span>${proj.title}</span>
                <span style="font-weight: 500; font-size: 12px; color: #2563eb;">${proj.tech || ''}</span>
              </div>
              <div class="cv-item-desc" style="margin-top: 4px;">${proj.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    // Certifications Section
    if (certList.length > 0) {
      mainColHTML += `
        <div>
          <h2 class="main-section-title">Certifications</h2>
          ${certList.map(cert => `
            <div style="font-size: 13px; margin-bottom: 10px;">
              <div style="font-weight: 700; color: #0f172a; display: flex; justify-content: space-between;">
                <span>${cert.name}</span>
                <span style="font-weight: normal; font-size: 12px; color: #64748b;">${cert.date}</span>
              </div>
              <div style="color: #475569; font-size: 12px;">${cert.issuer}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    mainColHTML += `</div>`; // Close main-col
    paper.innerHTML = sideColHTML + mainColHTML;
  } else if (templateName === 'creative') {
    // ==========================================
    // ELEGANT CREATIVE TEMPLATE (Header Banner Layout)
    // ==========================================
    let headerHTML = `
      <div class="header-banner">
        <div class="header-text">
          <h1>${personalInfo.fullName || 'Your Name'}</h1>
          <p>${skillTags[0] || 'Professional Specialist'}</p>
        </div>
        <div class="header-contact">
          ${personalInfo.email ? `<span>Email: ${personalInfo.email}</span>` : ''}
          ${personalInfo.phone ? `<span>Phone: ${personalInfo.phone}</span>` : ''}
          ${personalInfo.linkedin ? `<span>LinkedIn: ${personalInfo.linkedin}</span>` : ''}
        </div>
      </div>
    `;
    let bodyLeftHTML = `<div class="body-left">`;
    // Experience in main left column
    if (expList.length > 0) {
      bodyLeftHTML += `
        <div class="cv-section">
          <h2 class="cv-section-title">Experience</h2>
          ${expList.map(exp => `
            <div class="cv-item">
              <div class="cv-item-header">${exp.company}</div>
              <div class="cv-item-sub">${exp.role}</div>
              <div class="cv-item-date">${exp.date}</div>
              <div class="cv-item-desc">${exp.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    // Projects in main left column
    if (projList.length > 0) {
      bodyLeftHTML += `
        <div class="cv-section">
          <h2 class="cv-section-title">Projects</h2>
          ${projList.map(proj => `
            <div class="cv-item">
              <div class="cv-item-header">${proj.title}</div>
              <div class="cv-item-sub" style="color: #475569; font-weight: 500;">${proj.tech || ''}</div>
              <div class="cv-item-desc">${proj.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    bodyLeftHTML += `</div>`; // Close body-left
    let bodyRightHTML = `<div class="body-right">`;
    // Skills in sidebar
    if (skillTags.length > 0) {
      bodyRightHTML += `
        <div class="cv-section">
          <h2 class="cv-section-title">Skills</h2>
          <div>
            ${skillTags.map(tag => `<span class="cv-skill-tag">${tag}</span>`).join('')}
          </div>
        </div>
      `;
    }
    // Education in sidebar
    if (eduList.length > 0) {
      bodyRightHTML += `
        <div class="cv-section">
          <h2 class="cv-section-title">Education</h2>
          ${eduList.map(edu => `
            <div class="sidebar-item">
              <div class="sidebar-item-title">${edu.school}</div>
              <div class="sidebar-item-sub">${edu.degree}</div>
              <div class="sidebar-item-date">${edu.year}</div>
              ${edu.details ? `<div style="font-size: 11px; font-style: italic; color: #64748b; margin-top: 2px;">${edu.details}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }
    // Certifications in sidebar
    if (certList.length > 0) {
      bodyRightHTML += `
        <div class="cv-section">
          <h2 class="cv-section-title">Certifications</h2>
          ${certList.map(cert => `
            <div class="sidebar-item">
              <div class="sidebar-item-title">${cert.name}</div>
              <div class="sidebar-item-sub">${cert.issuer}</div>
              <div class="sidebar-item-date">${cert.date}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    bodyRightHTML += `</div>`; // Close body-right
    const bodyContainer = `<div class="main-body">${bodyLeftHTML}${bodyRightHTML}</div>`;
    paper.innerHTML = headerHTML + bodyContainer;
  }
}
/**
 * 6. High Fidelity PDF Exporter using html2pdf.js
 */
function exportPDF() {
  const paper = document.getElementById('resume-document-paper');
  if (!paper) return;
  const personalInfo = resumeData.personal || {};
  const applicantName = personalInfo.fullName || 'ResumeLeader';
  const cleanFilename = `${applicantName.replace(/\s+/g, '_')}_Resume.pdf`;
  // Pre-download layout adjustment if necessary
  const opt = {
    margin:       0,
    filename:     cleanFilename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  // Run conversion
  html2pdf().set(opt).from(paper).save().then(() => {
    console.log('PDF successfully generated and download triggered!');
  }).catch(err => {
    console.error('Error rendering PDF with html2pdf.js:', err);
    alert('Oops! Something went wrong while generating the PDF. Please try again.');
  });
}
/**
 * Core Application Dispatcher
 */
document.addEventListener('DOMContentLoaded', () => {
  initState();
  
  // Launch specific sub-controllers depending on DOM structure
  initFormWizard();
  initPreviewPage();
});
