function generateResume(){

document.getElementById("rname").innerText =
document.getElementById("name").value;

document.getElementById("remail").innerText =
document.getElementById("email").value;

document.getElementById("rphone").innerText =
document.getElementById("phone").value;

document.getElementById("reducation").innerText =
document.getElementById("education").value;

document.getElementById("rskills").innerText =
document.getElementById("skills").value;

document.getElementById("rprojects").innerText =
document.getElementById("projects").value;

document.getElementById("rexperience").innerText =
document.getElementById("experience").value;
}

function downloadPDF(){

const resume =
document.getElementById("resume");

html2pdf().from(resume).save("Resume.pdf");

}