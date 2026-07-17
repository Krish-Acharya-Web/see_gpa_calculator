const gradeScale = [
  { min: 90, grade: "A+", point: 4.0 },
  { min: 80, grade: "A", point: 3.6 },
  { min: 70, grade: "B+", point: 3.2 },
  { min: 60, grade: "B", point: 2.8 },
  { min: 50, grade: "C+", point: 2.4 },
  { min: 40, grade: "C", point: 2.0 },
  { min: 35, grade: "D+", point: 1.6 },
];

const gpaScale = [
  { min: 3.6, grade: "A+" },
  { min: 3.2, grade: "A" },
  { min: 2.8, grade: "B+" },
  { min: 2.4, grade: "B" },
  { min: 2.0, grade: "C+" },
  { min: 1.600001, grade: "C" },
  { min: 1.6, grade: "D+" },
];

const subjects = [
  {
    id: "english",
    name: "English",
    theory: { max: 75, credit: 3.75, passMark: 27 },
    practical: { max: 25, credit: 1.25, passMark: 9 },
  },
  {
    id: "nepali",
    name: "Nepali",
    theory: { max: 75, credit: 3.75, passMark: 27 },
    practical: { max: 25, credit: 1.25, passMark: 9 },
  },
  {
    id: "math",
    name: "Compulsory Math",
    theory: { max: 75, credit: 3.75, passMark: 27 },
    practical: { max: 25, credit: 1.25, passMark: 9 },
  },
  {
    id: "science",
    name: "Science",
    theory: { max: 75, credit: 3.75, passMark: 27 },
    practical: { max: 25, credit: 1.25, passMark: 9 },
  },
  {
    id: "social",
    name: "Social Studies",
    theory: { max: 75, credit: 3.75, passMark: 27 },
    practical: { max: 25, credit: 1.25, passMark: 9 },
  },
  {
    id: "optional1",
    name: "Optional I",
    variants: {
      other: {
        label: "Optional I - Other Subject",
        theory: { max: 75, credit: 3.0, passMark: 27 },
        practical: { max: 25, credit: 1.0, passMark: 9 },
      },
      computer: {
        label: "Optional I - Computer",
        theory: { max: 50, credit: 3.0, passMark: 18 },
        practical: { max: 50, credit: 1.0, passMark: 18 },
      },
    },
  },
  {
    id: "optional2",
    name: "Optional II",
    theory: { max: 75, credit: 3.0, passMark: 27 },
    practical: { max: 25, credit: 1.0, passMark: 9 },
  },
];

const form = document.querySelector("#gpaForm");
const optionalOneType = document.querySelector("#optionalOneType");
const finalCard = document.querySelector("#finalCard");
const finalMessage = document.querySelector("#finalMessage");
const finalGpa = document.querySelector("#finalGpa");
const finalGrade = document.querySelector("#finalGrade");
const resultState = document.querySelector("#resultState");
const totalCreditsOutput = document.querySelector("#totalCredits");
const headerCredits = document.querySelector("#headerCredits");
const weightedPointsOutput = document.querySelector("#weightedPoints");
const subjectResults = document.querySelector("#subjectResults");
const markInputs = Array.from(document.querySelectorAll("input[data-subject-id]"));

function resolveSubject(subject) {
  if (!subject.variants) {
    return subject;
  }

  const variant = subject.variants[optionalOneType.value];

  return {
    id: subject.id,
    name: variant.label,
    theory: variant.theory,
    practical: variant.practical,
  };
}

function getResolvedSubjects() {
  return subjects.map(resolveSubject);
}

function getSubjectById(subjectId) {
  return getResolvedSubjects().find((subject) => subject.id === subjectId);
}

function getGradeFromPercentage(percentage) {
  return gradeScale.find((item) => percentage >= item.min) || {
    grade: "NG",
    point: 0,
  };
}

function getGradeFromGpa(gpa) {
  return gpaScale.find((item) => gpa >= item.min)?.grade || "NG";
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return value.toFixed(digits);
}

function roundNumber(value, digits = 2) {
  return Number(formatNumber(value, digits));
}

function getInput(subjectId, component) {
  return document.querySelector(
    `input[data-subject-id="${subjectId}"][data-component="${component}"]`
  );
}

function getErrorNode(input) {
  return document.querySelector(`[data-error-for="${input.id}"]`);
}

function setInputBounds(input) {
  const subject = getSubjectById(input.dataset.subjectId);
  const component = subject[input.dataset.component];

  input.min = 0;
  input.max = component.max;
  input.placeholder = `0 - ${component.max}`;

  const maxOutput = document.querySelector(`[data-max-output="${input.id}"]`);
  if (maxOutput) {
    maxOutput.textContent = component.max;
  }
}

function normalizeInput(input) {
  setInputBounds(input);

  const max = Number(input.max);
  const errorNode = getErrorNode(input);

  input.classList.remove("is-invalid");
  if (errorNode) {
    errorNode.textContent = "";
  }

  if (input.value === "") {
    return true;
  }

  const value = Number(input.value);
  if (!Number.isFinite(value)) {
    input.classList.add("is-invalid");
    if (errorNode) {
      errorNode.textContent = "Enter a valid mark.";
    }
    return false;
  }

  if (value < 0) {
    input.value = 0;
  }

  if (value > max) {
    input.value = max;
  }

  return true;
}

function resetFinalCard() {
  finalCard.classList.remove("is-pass", "is-fail");
  finalMessage.textContent = "Fill all marks to calculate your GPA.";
  finalGpa.textContent = "--";
  finalGrade.textContent = "--";
  resultState.textContent = "Waiting for marks";
  weightedPointsOutput.textContent = "--";
}

function renderEmptyResults() {
  subjectResults.innerHTML = `
    <tr>
      <td colspan="5">No calculation yet.</td>
    </tr>
  `;
}

function renderSubjectRows(rows) {
  subjectResults.innerHTML = rows
    .map((row) => {
      const gradeClass = row.failed ? "status-ng" : "";

      return `
        <tr>
          <td>${row.name}</td>
          <td class="${row.theory.failed ? "status-ng" : ""}">
            ${row.theory.grade}
            <small>${formatNumber(row.theory.percentage)}% | GP ${formatNumber(row.theory.point)}</small>
          </td>
          <td class="${row.practical.failed ? "status-ng" : ""}">
            ${row.practical.grade}
            <small>${formatNumber(row.practical.percentage)}% | GP ${formatNumber(row.practical.point)}</small>
          </td>
          <td class="${gradeClass}">${row.failed ? "NG" : formatNumber(row.gpa)}</td>
          <td class="${gradeClass}">${row.failed ? "NG" : row.grade}</td>
        </tr>
      `;
    })
    .join("");
}

function calculateComponent(mark, component) {
  const percentage = (mark / component.max) * 100;
  const failed = mark < component.passMark;
  const gradeInfo = failed ? { grade: "NG", point: 0 } : getGradeFromPercentage(percentage);

  return {
    mark,
    percentage,
    grade: gradeInfo.grade,
    point: gradeInfo.point,
    credit: component.credit,
    weighted: gradeInfo.point * component.credit,
    failed,
  };
}

function calculateGpa() {
  markInputs.forEach(normalizeInput);

  const resolvedSubjects = getResolvedSubjects();
  const totalCredits = resolvedSubjects.reduce(
    (sum, subject) => sum + subject.theory.credit + subject.practical.credit,
    0
  );

  totalCreditsOutput.textContent = formatNumber(totalCredits);
  headerCredits.textContent = formatNumber(totalCredits);

  const hasEmptyInput = markInputs.some((input) => input.value === "");
  if (hasEmptyInput) {
    resetFinalCard();
    renderEmptyResults();
    return;
  }

  const rows = [];
  let totalWeightedPoints = 0;
  let failedSubjectCount = 0;

  for (const subject of resolvedSubjects) {
    const theoryInput = getInput(subject.id, "theory");
    const practicalInput = getInput(subject.id, "practical");
    const theoryMark = Number(theoryInput.value);
    const practicalMark = Number(practicalInput.value);

    const theory = calculateComponent(theoryMark, subject.theory);
    const practical = calculateComponent(practicalMark, subject.practical);
    const failed = theory.failed || practical.failed;
    const subjectCredits = subject.theory.credit + subject.practical.credit;
    const subjectWeighted = theory.weighted + practical.weighted;
    const subjectGpa = failed ? 0 : subjectWeighted / subjectCredits;

    if (failed) {
      failedSubjectCount += 1;
    } else {
      totalWeightedPoints += subjectWeighted;
    }

    rows.push({
      name: subject.name,
      theory,
      practical,
      failed,
      gpa: subjectGpa,
      grade: failed ? "NG" : getGradeFromGpa(roundNumber(subjectGpa)),
    });
  }

  renderSubjectRows(rows);

  if (failedSubjectCount > 0) {
    finalCard.classList.remove("is-pass");
    finalCard.classList.add("is-fail");
    finalMessage.textContent = "NG (Non Graded). One or more subjects did not meet the pass mark.";
    finalGpa.textContent = "NG";
    finalGrade.textContent = "Non Graded";
    resultState.textContent = "NG";
    weightedPointsOutput.textContent = "--";
    return;
  }

  const gpa = totalWeightedPoints / totalCredits;
  const grade = getGradeFromGpa(roundNumber(gpa));

  finalCard.classList.remove("is-fail");
  finalCard.classList.add("is-pass");
  finalMessage.textContent = "Congratulations! Your unofficial GPA has been calculated.";
  finalGpa.textContent = formatNumber(gpa);
  finalGrade.textContent = grade;
  resultState.textContent = "Passed";
  weightedPointsOutput.textContent = formatNumber(totalWeightedPoints);
}

function updateOptionalOneFields() {
  markInputs.forEach(setInputBounds);

  const optionalSubject = getSubjectById("optional1");
  const optionalCredits = optionalSubject.theory.credit + optionalSubject.practical.credit;
  document.querySelector("#optionalOneCredits").textContent = `${formatNumber(optionalCredits)} credits`;

  normalizeInput(getInput("optional1", "theory"));
  normalizeInput(getInput("optional1", "practical"));
  calculateGpa();
}

markInputs.forEach((input) => {
  setInputBounds(input);
  input.addEventListener("input", () => {
    normalizeInput(input);
    calculateGpa();
  });
});

optionalOneType.addEventListener("change", updateOptionalOneFields);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateGpa();
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    optionalOneType.value = "other";
    markInputs.forEach((input) => {
      input.classList.remove("is-invalid");
      const errorNode = getErrorNode(input);
      if (errorNode) {
        errorNode.textContent = "";
      }
    });
    updateOptionalOneFields();
    resetFinalCard();
    renderEmptyResults();
  }, 0);
});

updateOptionalOneFields();
