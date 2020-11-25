const https = require('https');
const axios = require('axios').default.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });


// https://teamcity.cluster.build.ngiris.io/app/rest/builds?locator=project:(id:CascadeHr_Legacy),buildType:(id:CascadeHr_Legacy_Cascade)

  //https://teamcity.cluster.build.ngiris.io/app/rest/buildTypes?locator=affectedProject:(id:CascadeHr_Legacy)&fields=buildType(id,name,builds($locator(running:false,canceled:false,count:1),build(number,status,statusText)))
//https://teamcity.cluster.build.ngiris.io/app/rest/buildTypes?locator=affectedProject:(id:CascadeHr_Legacy)&fields=buildType(id,name,branchName,builds($locator(running:false,canceled:false,count:1),build(number,status,statusText,branchName)))
// eyJ0eXAiOiAiVENWMiJ9.enhHd1lESHp3N3R3MU84SWFrTEhnanh5cTBV.M2Q3MjgzOGMtMWY0ZC00OGJmLTk5MjEtMTIxYWUyNTNkZmI3
// https://teamcity.cluster.build.ngiris.io/

// https://teamcity.cluster.build.ngiris.io/app/rest/projects?locator=selectedByUser:current&fields=count,project(id,parentProjectId,buildTypes(count,buildType(id),$locator(selectedByUser:current)))

//https://teamcity.cluster.build.ngiris.io/app/rest/builds/?locator=project:(id:CascadeHr_Novo),count:20
//https://teamcity.cluster.build.ngiris.io/app/rest/projects?locator=selectedByUser:current&fields=count,project(id,parentProjectId,projects(count,project(id),$locator(selectedByUser:current)),buildTypes(count,buildType(id),$locator(selectedByUser:current)))

// https://teamcity.cluster.build.ngiris.io/app/rest/builds?locator=buildType:(id:CascadeHr_Legacy_Cascade),running:any,count:20

const paths = {
    projects: 'app/rest/projects',
    buildTypes: 'app/rest/buildTypes',
    users: 'app/rest/users',
    builds: 'app/rest/builds'
};

module.exports.TeamCity = class TeamCity {
    #url = '';
    #token = '';

    constructor(url) {
        if (!url) throw new ReferenceError('url not defined');

        this.#url = url;
    }

    projects() {
        const url = new URL(this.#url);

        url.pathname = paths.projects;
        
        return axios.get(url.toString(), {
            headers: {
                'authorization': `Bearer ${this.#token}`,
                'accepts': 'application/json'
            },
            params: {
                //locator: 'selectedByUser:current',
                fields: 'count,project(id,name,parentProjectId,buildTypes(count,buildType(id,name),$locator(selectedByUser:current)))'
            }
        });
    }

    async builds(typeId) {        
        const url = new URL(this.#url);

        url.pathname = paths.builds;
        
        const response = await axios.get(url.toString(), {
            headers: {
                'authorization': `Bearer ${this.#token}`,
                'accepts': 'application/json'
            },
            params: {
                fields: 'build(lastChanges(change(username)),triggered(user(username),type),id,number,branchName,status,state,username),user:($long)',
                locator: `buildType:(id:${typeId}),running:any,count:200,canceled:any,branch:default:any`
            }
        });

        return response.data.build;
    }

    projectInfo(projectId) {
        const url = new URL(this.#url);

        url.pathname = paths.buildTypes;
        
        return axios.get(url.toString(), {
            headers: {
                'authorization': `Bearer ${this.#token}`,
                'accepts': 'application/json'
            },
            params: {
                locator: `affectedProject:(id:${projectId})`,
                fields: 'buildType(id,name,branchName,builds($locator(running:false,canceled:false,count:1),build(number,status,statusText,branchName)))'
            }
        });
    }

    async getUsers() {
        const url = new URL(this.#url);

        url.pathname = paths.users;
        
        const response = await axios.get(url.toString(), {
            headers: {
                'authorization': `Bearer ${this.#token}`,
                'accepts': 'application/json'
            }
        });

        return response.data.user.sort((a, b) => a.name > b.name ? 1 : -1);
    }

    async getUserProperty(username, propertyname, raw = false) {
        const url = new URL(this.#url);

        url.pathname = `${paths.users}/username:${username}/properties/${propertyname}`;

        try {
            const response = await axios.get(url.toString(), {
                headers: {
                    'authorization': `Bearer ${this.#token}`,
                    'accepts': raw ? 'text/plain' : 'application/json'
                }
            });

            return response.data;
    
        } catch(e) {
            if (e.response?.status === 404)
                return undefined;
            else
                throw e;
        }
    }

    buildTypes(projectId) {
        const url = new URL(this.#url);

        url.pathname = paths.projects;

        url.pathname += `/project:(:id${projectId})`;
        
        return axios.get(url.toString(), {
            headers: {
                'authorization': `Bearer ${this.#token}`,
                'accepts': 'application/json'
            }
        });
    }

    project(projectId) {
        const url = new URL(this.#url);

        url.pathname = paths.projects;

        url.pathname += `/id:${projectId}`;
        
        return axios.get(url.toString(), {
            headers: {
                'authorization': `Bearer ${this.#token}`,
                'accepts': 'application/json'
            }
        });
    }

    hasToken() {
        return !!this.#token;
    }

    setToken(token) {
        if (!token)
            return;

        this.#token = token;
    }
}

