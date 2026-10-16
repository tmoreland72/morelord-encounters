import { createChoiceGroup } from '../../../morelord-core/scripts/ui/choice-group.js';
import { GUIDED_CHOICES, GUIDED_FIELDS, normalizeGuidance } from "../domain/guided-encounters.mjs";

const text = (tag, value, className = "") => {
  const element = document.createElement(tag);
  element.textContent = value;
  element.className = className;
  return element;
};

export function encounterModeChoices(mode) {
  if (typeof mode === "boolean") mode = mode ? "guided" : "roster";
  return createChoiceGroup({name:'encounterMode',label:'Encounter Type',value:mode,choices:[
    {value:'roster',label:'Combat Encounters',icon:'fa-hydra',description:'Build or open a saved combat roster.'},
    {value:'guided',label:'Guide Me Encounters',icon:'fa-compass',description:'Create a guided non-combat situation.'},
    {value:'stories',label:'Encounter Stories',icon:'fa-book-open',description:'Premium adventures with editable GM journals.'},
    {value:'mass',label:'Mass Combat',icon:'fa-people-group',description:'Schedule saved rosters in native initiative and resolve mob attacks.'}
  ]});
}

export function guidedQuestions(guidance) {
  const answers = normalizeGuidance(guidance);
  const section = document.createElement("section");
  section.className = "ml-surface ml-stack ml-encounters-guided-panel";
  section.append(text("h2", "Shape the situation"), text("p", "No setting in mind? Leave “Choose for me” selected. Every result includes ways to engage, optional checks, and consequences."));
  const fields = document.createElement("div");
  fields.className = "ml-stack";
  const questions = {
    setting: "Where could this happen?", interaction: "What will the party do?",
    purpose: "What should this add to the story?", stakes: "How much pressure should there be?"
  };
  let row;
  for (const [index, [key, choices]] of Object.entries(GUIDED_CHOICES).entries()) {
    if (index % 2 === 0) {
      row = document.createElement("div");
      row.className = "ml-grid";
      row.dataset.columns = "auto";
      fields.append(row);
    }
    const label = document.createElement("label");
    const select = document.createElement("select");
    select.name = `guided.${key}`;
    for (const [value, title] of Object.entries(choices)) {
      const option = text("option", title);
      option.value = value;
      option.defaultSelected = answers[key] === value;
      select.append(option);
    }
    label.append(text("span", questions[key]), select);
    row.append(label);
  }
  const label = document.createElement("label");
  const connection = document.createElement("input");
  connection.type = "text";
  connection.name = "guided.connection";
  connection.maxLength = 240;
  connection.defaultValue = answers.connection;
  connection.placeholder = "For example: the missing caravan, the Lantern Guild, or an old friend";
  label.append(text("span", "Connect it to your campaign (optional)"), connection);
  section.append(fields, label, text("small", "These scenes can be resolved without combat. No party selection or monster sources are needed."));
  return section;
}

export function guidanceFromForm(form) {
  return normalizeGuidance(Object.fromEntries([...form.querySelectorAll("[name^='guided.']")]
    .map(input => [input.name.slice(7), input.value])));
}

export function guidedSceneContent(encounter) {
  const content = document.createElement("div");
  const wrapper = document.createElement("div");
  wrapper.className = "ml-stack ml-encounters-roster ml-encounters-guided-scene";
  const heading = document.createElement("header");
  heading.className = "ml-hero";
  const body = document.createElement("div");
  body.className = "ml-hero__body";
  const name = text("h1", encounter.name);
  name.dataset.sceneValue = "name";
  const description = text("p", encounter.description);
  description.dataset.sceneValue = "description";
  body.append(name, description);
  heading.append(body);
  const editor = document.createElement("details");
  editor.className = "ml-details";
  editor.append(text("summary", "Edit this scene"));
  const controls = document.createElement("div");
  controls.className = "ml-details__body ml-stack";
  for (const [key, title] of Object.entries({ name: "Encounter name", description: "Setting and summary", ...GUIDED_FIELDS })) {
    const label = document.createElement("label");
    const input = document.createElement(key in GUIDED_FIELDS ? "textarea" : "input");
    input.dataset.guidedField = key;
    if (input.tagName === "TEXTAREA") input.rows = 3;
    else input.type = "text";
    input.maxLength = key === "name" ? 200 : 6000;
    input.defaultValue = (key in GUIDED_FIELDS ? encounter.scene[key] : encounter[key]) ?? "";
    label.append(text("span", title), input);
    controls.append(label);
  }
  editor.append(controls);
  wrapper.append(heading, text("small", "GM preparation • Checks are suggestions. Reward good plans, tools, and spells without requiring a roll."), editor);
  for (const [key, title] of Object.entries(GUIDED_FIELDS)) {
    const section = document.createElement("section");
    section.className = "ml-surface ml-stack";
    const copy = text("p", encounter.scene[key]);
    copy.className = "ml-encounters-scene-copy";
    copy.dataset.sceneValue = key;
    section.append(text("h2", title), copy);
    wrapper.append(section);
  }
  content.append(wrapper);
  return content;
}

export function updateGuidedField(input, encounter) {
  const key = input.dataset.guidedField;
  if (key in GUIDED_FIELDS) encounter.scene[key] = input.value;
  else if (["name", "description"].includes(key)) encounter[key] = input.value;
  else return;
  const value = input.closest(".ml-encounters-guided-scene")?.querySelector(`[data-scene-value='${key}']`);
  if (value) value.textContent = input.value;
}
