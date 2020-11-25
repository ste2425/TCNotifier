import { select, create, from } from '../../domHelper.js';
import { emitToPreload, registerHandlers } from '../../messaging.js';
import { nextTab, previousTab, tabMovingForward } from './tabs.js';

// handlers received from preload
const preloadMessageHandlers = {
    projectList: (projects) => {
        projects.project.forEach(p => renderProject(p));
    },
    userList: (users) => {
        users.forEach(u => renderUser(u));
    }
}

function renderUser(user) {
    const template = select('#user-template'),
        clone = template.el.content.cloneNode(true),
        label = select('label', clone),
        input = select('input', clone);

    label
        .text(`${user.name} (${user.username} : ${user.vcsUsernames.join(', ')})`)
        .attr({
            for: `chk-${user.id}`
        });

    input
        .data({
            username: `${user.username},${user.vcsUsernames.join(',')}`
        })
        .id(`chk-${user.id}`);

    select('.data-users ul').append(clone);
}

function renderBuildTypes(types, clone) {
    const  buildListEL = select('.build ul', clone);

    types.forEach(type => {
        const li = create('li'),
            chk = create('input'),
            label = create('label');

        chk.type('checkbox')
            .id(`chk-${type.id}`)
            .data({ typeId: type.id })
            .addClass('filter-on-type');
        
        label.attr({ for: `chk-${type.id}` }).text(type.name);

        li.addClass('build-type')
            .append(label.el)
            .append(chk.el);

        buildListEL.append(li.el);
    });
}

function renderProject(project) {
    const template = select('#project-template'),
        clone = template.el.content.cloneNode(true);

    const projectContainer = select('.project', clone),
        projectNameEl = select('.project-name', clone),
        buildListContainer = select('.build', clone),
        projectContent = select('.project-content', clone);

    projectContainer.id(project.id);

    projectNameEl.query('.text').text(project.name);
    projectNameEl.query('small').text(project.id);

    renderBuildTypes(project.buildTypes.buildType, clone);

    if (project.buildTypes.buildType.length === 0) {
        buildListContainer.addClass('hide');
    }

    if (project.id === '_Root') {
        projectContent.removeClass('hide');

        select('.toggle .oi', clone)
            .removeClass('oi-chevron-right')
            .addClass('oi-chevron-bottom');

        select('.data').append(clone);
    } else {
        const li = document.createElement('li');

        li.appendChild(clone);

        select(`#${project.parentProjectId} > .project-content > .children > ul`)
            .append(li);
    }
}

document.addEventListener('click', e => {
    const target = from(e.target);

    if (!target.some(x => x.matches('.toggle, .toggle *')))
        return;

    const parent = target.closest('.project'),
        chevron = parent.queryFirst('.oi'),
        content = parent.queryFirst('.project-content');

    chevron
        .removeClass('oi-chevron-right', 'oi-chevron-bottom');

    content
        .toggleClass('hide');

    if (content.hasClass('hide'))
        chevron.addClass('oi-chevron-right');
    else
        chevron.addClass('oi-chevron-bottom');        
});

document.addEventListener('DOMContentLoaded', () => {
    emitToPreload('getProjects');
    emitToPreload('getUsers');

    select('#profiles-tab').on('hide.bs.tab', validateProfilesTab);
    select('#users-tab').on('hide.bs.tab', validateUsersTab);

    select('.steps-buttons .next').on('click', () => nextTab('#tabs'));
    select('.steps-buttons .previous').on('click', () => previousTab('#tabs'));
    select('.steps-buttons .save').on('click', () => save());

    registerHandlers(preloadMessageHandlers);
});

function save() {
    const selectedUsers = select('.filter-on-user:checked')
        .toArray()
        .flatMap(x => x.dataset.username.toLowerCase().split(','))
    
    const selectedProjects = select('.filter-on-type:checked')
        .toArray()
        .map(x => x.dataset.typeId);  

    const selectedStatus = select('.select-status select').value;

    emitToPreload('saveBuildConfig', {
        selectedUsers,
        selectedProjects,
        selectedStatus
    });
}

function validateUsersTab(e) {
    const selectedUsers = select('.filter-on-user:checked'),
        valid = selectedUsers.length !== 0,
        movingForward = tabMovingForward(e.target, e.relatedTarget);

    if (!valid) {
        e.target.classList.add('step-error');

        select('#users-validation-warning').removeClass('hide');
        select('#users-validation-warning').el.scrollIntoView({
            behavior: 'smooth'
        });
    } else {
        e.target.classList.remove('step-error');
        e.target.classList.add('step-visited');
        select('#users-validation-warning').addClass('hide');

        select('.btn.save').removeClass('hide');
        select('.btn.next').addClass('hide');
    }

    if (movingForward && !valid)
        e.preventDefault();
}

function validateProfilesTab(e) {
    const selectedProjects = select('.filter-on-type:checked'),
        valid = selectedProjects.length !== 0,
        movingForward = tabMovingForward(e.target, e.relatedTarget);
    
    if (!valid) {
        e.target.classList.add('step-error');

        select('#project-validation-warning').removeClass('hide');
        select('#project-validation-warning').el.scrollIntoView({
            behavior: 'smooth'
        });
    } else {
        e.target.classList.remove('step-error');
        e.target.classList.add('step-visited');
        select('#project-validation-warning').addClass('hide');
    }

    if (movingForward && !valid)
        e.preventDefault();
}