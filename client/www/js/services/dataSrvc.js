angular.module('ourBoard').service('dataSrvc',
    function ($http, apiMap, ENV, $ionicLoading, $q, $ionicPopup) {
        this.api = function (cfg) {
            if (!apiMap[cfg.type].disableLoading) {
                $ionicLoading.show();
            }
            var url = getUrl(cfg.type, cfg.urlParamsObj);
            var requestPromise;

            if (apiMap[cfg.type].method === 'POST') {
                requestPromise = $http.post(url, cfg.args);
            }
            else if (apiMap[cfg.type].method === 'PUT') {
                requestPromise = $http.put(url, cfg.args);
            } else {
                requestPromise = $http.get(url);
            }
            return requestPromise.then(function (res) {
                if (!apiMap[cfg.type].disableLoading) {
                    $ionicLoading.hide();
                }
                return res;
            }, function (err) {
                if (!apiMap[cfg.type].disableLoading) {
                    $ionicLoading.hide();
                }
                $ionicPopup.alert({
                    title: err.data.message
                });
                return $q.reject(err);
            });
        };

        var getUrl = function (type, urlParamsObj) {
            return ENV.API_URL + (apiMap[type].url || _.template(apiMap[type].urlTemplate)(urlParamsObj));
        };

    });
