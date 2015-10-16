/**
 * Created by maxime on 2015-10-13.
 */

exports.scrape = function(){
    request({
            uri: url,
            method: 'GET'
        },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                successItunesCallback(res, JSON.parse(body), amount, type);
            } else {
                errorCallback(res, error, response, body);
            }
        }
    );
    async.forEachLimit()
}

waitForRateLimiting = function(){

}