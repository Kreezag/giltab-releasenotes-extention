import { requestAggregator } from "./generator";

interface Project {
  readonly id: number;
  readonly name: string;
}

interface Tag {
  readonly tag_name: string;
  readonly name: string;
}

interface Option {
  label: string;
  value: string;
}

interface SelectType {
    PROJECT: 'project';
    RELEASE: 'release';
}

const gitlabSite = process.env.GITLAB_RESOURCE || "";
const jiraSite = process.env.JIRA_RESOURCE || "";

const token = process.env.PRIVATE_TOKEN || "";

const PARENT_SELECTOR = "top-level-version-info";

const SELECT_TYPE: SelectType = {
    PROJECT: 'project',
    RELEASE: 'release'
}

const SELECT_DEFAULT: string = '-placeholder-';

const URL_BASE = `${gitlabSite}/api/v4/projects/`;
const URL_COMMON_PARAMS = `private_token=${token}&archived=false&simple=true&sort=asc`;

const createPageParams = (page) => page ? `&page=${page}` : '';

const createProjectsUrl = (page) => `${URL_BASE}?${URL_COMMON_PARAMS}${createPageParams(page)}`;
const createTagsUrl = (projectId, page) => `${URL_BASE}/${projectId}/releases?${URL_COMMON_PARAMS}${createPageParams(page)}`;


const api = <T>(url: string): Promise<T> => {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
};

const getProjectOptionsByPage = (page: number = 0) =>
  api<Project[]>(createProjectsUrl(page))
    .then(data => data.map(({ name, id }) => ({ label: name, value: String(id) })) || [])
    .catch(error => {
      throw new Error(error);
    });

const getReleaseOptions = (projectId, page) =>
  api<Tag[]>(createTagsUrl(projectId, page))
    .then(data => data.map(({ name, tag_name }) => ({ value: tag_name, label: name })) || [])
    .catch(error => {
      throw new Error(error);
    });



const makePlaceholderOptionData = (name: string): Option => ({ label: `- Select ${name} -`, value: SELECT_DEFAULT });

const applySelectOption = (selectEl: HTMLSelectElement, option: Option) => {
    const optionEl = document.createElement("option");

    optionEl.innerText = option.label;
    optionEl.value = option.value;

    selectEl.appendChild(optionEl);

    return optionEl;
};

const createSelect = (type: string, optionsData: Option[]) => {
  const selectEl: HTMLSelectElement = document.createElement("select");

  selectEl.dataset.type = type;
  selectEl.disabled = (optionsData.length === 0);

  [makePlaceholderOptionData(type), ...optionsData].forEach(
    (option) => applySelectOption(selectEl, option)
  );

  document
    .querySelector(`.${PARENT_SELECTOR}`)
    .appendChild(selectEl);

  return selectEl;
};

const removeSelect = (type: string) => {
    document.querySelector(`select[data-type="${type}"]`)?.remove();
};


const updateReleaseSelect = (projectId) => {
    const selectEl: HTMLSelectElement = document.querySelector(`select[data-type="${SELECT_TYPE.RELEASE}"]`);

    const createReleaseSelect = (optionsData) => createSelect(
        SELECT_TYPE.RELEASE,
        optionsData
    );

    if (!selectEl) {
        requestAggregator((page) => getReleaseOptions(projectId, page), createReleaseSelect);

        return;
    }

    selectEl.querySelectorAll('option').forEach((optionEl) => {
        if (optionEl.value !== SELECT_DEFAULT) {
            optionEl.remove()
        }
    });

    const setSelectOptions = (optionsData = []) => {
        selectEl.disabled = (optionsData.length == 0);
        optionsData.forEach((option) =>  applySelectOption(selectEl, option))
    };

    requestAggregator((page) =>
        getReleaseOptions(projectId, page),
        setSelectOptions
    )
};


const isJiraProjectPage = window.location.href.includes(`${jiraSite}/`);

if (isJiraProjectPage) {
    const createProjectSelect = (optionsData) => {
        const select = createSelect(SELECT_TYPE.PROJECT, optionsData);

        select.onchange = () => {
            if (select.value !== SELECT_DEFAULT) {
                updateReleaseSelect(select.value)
            } else {
                removeSelect(SELECT_TYPE.RELEASE)
            }
        }
    };

    requestAggregator((page) => getProjectOptionsByPage(page), createProjectSelect)
}
