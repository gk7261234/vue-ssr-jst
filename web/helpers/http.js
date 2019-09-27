import axios from  'axios';
import { isServer, isBrowser, getData, qs, sleep } from './utils'

const caches = {};
const http = async (opts) => {
    const { url, method = 'get', params, data, retry = {}, cache = false } = opts;
    Object.assign(opts, {
        url: !/^http(s)?:/.test(url) && !isBrowser() ?
            `http:${url}` : url,
        timeout: (retry && --retry.total) ?
            retry.timeout : opts.__timeout
    });
    try {
        if (!cache) {
            return await axios(opts);
        }

        const key = `${url}${qs.stringify({
            method,
            current_page: 1,
            enddate: "2019-09-24",
            optstocklist: ["000999", "002381", "600390", "600416", "600681", "300435", "002649", "600781", "000725", "000895"],
            page_size: 5,
            startdate: "2019-08-25",
        })}`;

        if (caches[key]) {
            await sleep(10);
            return JSON.parse(JSON.stringify(caches[key]));
        }
        const res = await axios(opts);
        caches[key] = JSON.parse(JSON.stringify(res));
        return res;

    } catch (ex) {
        if (!retry.total) {
            const { data, status } = getData(ex, 'response') || {};
            if (isBrowser() && status == 403) {
                return location.href = '/login';
            }

            return Promise.reject(data || ex);
        }

        return await http(opts);
    }
};

export default async (opts) => {
    const reqHeaders = opts.headers;
    if (reqHeaders) {

        // only specify header is allowed
        opts.headers = {};

        if (isServer()) {
            // cookies
            const cookies = reqHeaders['cookie'];
            if (cookies) {
                opts.headers['cookie'] = cookies;
            }

            // set-cookie
            const setCookies = reqHeaders['set-cookie'];
            if (setCookies && setCookies.length) {
                if (isServer()) {
                    const cookies = setCookies.reduce((cookies, setCookie) => {
                        cookies.push(setCookie.split(';')[0]);
                        return cookies;
                    }, []);

                    opts.headers['cookie'] = (opts.headers['cookie'] || '') + cookies.join('; ');
                }
            }
        }

        // Content-Type
        const contentType = reqHeaders['Content-Type'];
        if (contentType == 'application/x-www-form-urlencoded') {
            opts.transformRequest = [
                (data) => {
                    const res = [];
                    for (let it in data) {
                        res.push(encodeURIComponent(it) + '=' + encodeURIComponent(data[it]));
                    }
                    return res.join('&');
                }
            ];
        }

        // X-HTTP-Method-Override
        const methodOverride = reqHeaders['X-HTTP-Method-Override'];
        if (methodOverride) {
            opts.headers['X-HTTP-Method-Override'] = methodOverride;
        }
    }

    // backups
    opts.__timeout = opts.timeout || 15000;

    const { data, headers: resHeaders } = await http(opts);

    if (typeof data.err_code != 'undefined'
        && typeof data.err_desc != 'undefined'
    ) {
        if (data.err_code - 0 !== 0
            || data.err_desc !== '') {
            throw data;
        }

        return { data: data.data, headers: resHeaders };
    }


    /*
    // api format
    if (typeof data.error_code != 'undefined'
      && typeof data.error_description != 'undefined'
    ) {
      if (data.error_code !== 0 || data.error_description !== 'success') {
        throw data;
      }

      return {data: data.data, headers: resHeaders};
    }

    // cms-finder 接口兼容，后面高金改完后可删除
    if (typeof data.errcode != 'undefined'
      && typeof data.errmsg != 'undefined'
    ) {
      if (data.errcode !== 0 || data.errmsg !== 'success') {
        throw data;
      }

      return { data: data.data, headers: resHeaders };
    }
    */

    return {data, headers: resHeaders};
};
