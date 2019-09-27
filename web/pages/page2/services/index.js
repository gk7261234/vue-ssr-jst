import http from '../../../helpers/http';
export default {
    async getInfo(){
        let { data } = await http({
            method: 'post',
            url: '/optstocksecretary/datepage',
            data: {
                current_page: 1,
                enddate: "2019-09-24",
                optstocklist: ["000999", "002381", "600390", "600416", "600681", "300435", "002649", "600781", "000725", "000895"],
                page_size: 5,
                startdate: "2019-08-25",
            }
        });
        return { data }
    }
}
