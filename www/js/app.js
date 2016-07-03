//6.2016
//HungHNQ

var app = angular.module('rikkeicf', ['ionic','firebase']);

app.controller('main', function ($scope, $ionicModal, $ionicPopup, $firebaseArray) {

    // coffee list member
    var ref = new Firebase("https://rikkeicf.firebaseio.com/users");
    $scope.users = $firebaseArray(ref);

    // shop information
    var sRef = new Firebase("https://rikkeicf.firebaseio.com/shop");
    var sShop = $firebaseArray(sRef);

    // menu information
    var mRef = new Firebase("https://rikkeicf.firebaseio.com/menus");
    $scope.menus = $firebaseArray(mRef);

    // admin
    var aRef = new Firebase("https://rikkeicf.firebaseio.com/admins");
    $scope.admins = $firebaseArray(aRef);

    // sponsor
    var spRef = new Firebase("https://rikkeicf.firebaseio.com/sponsors");
    $scope.sponsors = $firebaseArray(spRef);

    var curIndex = 0; // for show current detail User

    $scope.user = {}; // for create new User

    $scope.choice = {
        name: 'food'
    };

    var arrAdmin =[]; // Admin list

    var i=0;
    var j=0;

    // Get local IP
    /* getIPs(function(ip){
     if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/)) {
     if ( $scope.users[curIndex].ip == ip) {

     } else {
     showPopupRefuse();
     }
     }
     });*/
    var ip = '192.168.0.183';

    // create modal for detail User screen
    $ionicModal.fromTemplateUrl('detail-user-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function (modal) {
        $scope.detailUserModal = modal;
    });

    // [MAIN SCREEN]
    // init screen
    $scope.init = function(){
        // Disabled all button
        document.getElementById("orderStartButton").disabled = true;
        document.getElementById("orderStopButton").disabled = true;
        document.getElementById("orderResetButton").disabled = true;
        // update money
        $scope.admins.$loaded().then(function() {
            $scope.menus.$loaded().then(function () {
                $scope.users.$loaded().then(function () {
                    // get order status and control admin button
                    updateOrderStatus('init');
                    // update order
                    updateTotalOrder();
                });
            });
        });
    }

    // Update status of button START, STOP
    function updateOrderStatus(status){
        switch (status){
            case 'init' :
                // Check access
                var okFlag = false;
                $scope.sponsorname = "";
                $scope.sponsors.$loaded().then(function() {
                    for (j = 0; j < $scope.sponsors.length; j++) {
                        if (ip == $scope.sponsors[j].ip) {
                            okFlag = true;
                        }
                        for (i = 0; i < $scope.users.length; i++) {
                            if ($scope.sponsors[j].ip == $scope.users[i].ip) {
                                $scope.sponsorname = $scope.sponsorname + ', ' + $scope.users[i].username;
                            }
                        }
                    }
                    // Format sponsor list name
                    if ($scope.sponsorname != "") {
                        $scope.sponsorname = $scope.sponsorname.substr(1, $scope.sponsorname.length);
                    } else {
                        $scope.sponsorname = $scope.sponsors[0].ip;
                    }

                    // Get admin list
                    for (i =0; i< $scope.admins.length;i++){
                        arrAdmin[i] = $scope.admins[i].ip;
                    }

                    // Setting phone number
                    $scope.phonenumber = sShop[0].phonenumber;

                    // For sponsors and admin
                    if((okFlag && sShop[0].sponsor_control == true) | arrAdmin.indexOf(ip) !=-1){
                        // For admin
                        sShop.$loaded().then(function(){
                            if (sShop[0].active == true){
                                document.getElementById("orderStartButton").disabled = true;
                                document.getElementById("orderStopButton").disabled = false;
                                document.getElementById("orderResetButton").disabled = false;
                            } else {
                                document.getElementById("orderStartButton").disabled = false;
                                document.getElementById("orderStopButton").disabled = true;
                                document.getElementById("orderResetButton").disabled = false;
                            }
                        })
                            .catch(function (error) {
                                alert("Có lỗi hệ thống. Vui lòng liên hệ với admin.");
                            });
                    };
                });
                break;
            case 'reset' :
                document.getElementById("orderStartButton").disabled = true;
                document.getElementById("orderStopButton").disabled = false;
                sShop[0].active = true;
                sShop.$save(0);
                break;
            case 'start' :
                document.getElementById("orderStartButton").disabled = true;
                document.getElementById("orderStopButton").disabled = false;
                sShop[0].active = true;
                sShop.$save(0);
                break;
            case 'stop' :
                document.getElementById("orderStartButton").disabled = false;
                document.getElementById("orderStopButton").disabled = true;
                sShop[0].active = false;
                sShop.$save(0);
                break;
            default :
                document.getElementById("orderStartButton").disabled = true;
                document.getElementById("orderStopButton").disabled = true;
                sShop[0].active = false;
                sShop.$save(0);
        }
    }

    // [ADMIN MENU]
    // Reset Order
    $scope.orderReset = function(){
        // Reset user
        if ($scope.users.length > -1) {
            for (i = 0; i < $scope.users.length; i++) {
                $scope.users[i].order = '';
                $scope.users[i].quantity = 0;
                $scope.users[i].completed = false;
                $scope.users.$save(i);
            }
        }
        // Reset menu
        if ($scope.menus.length > -1) {
            for (i = 0; i < $scope.menus.length; i++) {
                $scope.menus[i].quantity = 0;
                $scope.menus.$save(i);
            }
        }
        // Reset money
        $scope.money = "0";
        // Update admin menu
        updateOrderStatus('reset');
    };

    // Start Order
    $scope.orderStart = function(){
       updateOrderStatus('start');
    };

    // Stop Order
    $scope.orderStop = function(){
        updateOrderStatus('stop');
    };

    // Show order screen
    $scope.showDetail = function (index) {
        curIndex = index;

        if ( (ip == $scope.users[curIndex].ip) | (arrAdmin.indexOf(ip) !=-1) ) {
        } else {
            showPopupRefuse();
            return;
        }
        // Check if order is active
        if(sShop[0].active ==true){
            // Show order screen
            $scope.detailUserModal.show();
            // Control cancel button
            if($scope.users[curIndex].completed ==true){
                document.getElementById("orderCancelButton").disabled = false;
            } else {
                document.getElementById("orderCancelButton").disabled = true;
            }
        } else {
            // Room is not active
            var confirmPopup = $ionicPopup.alert({
                title: 'Thông báo',
                template: 'Hệ thống Order chưa được kích hoạt hoặc đã kết thúc.<p>Vui lòng liên hệ với admin.'
            });
        }
   };

    // [ORDER SCREEN]
    // close detail User screen
    $scope.closeDetailUser = function () {
        $scope.detailUserModal.hide();
    };

    // update User when edit completed
    $scope.orderCompleted =function(){

        if (curIndex !=-1 ){
            $scope.users[curIndex].order = $scope.choice.name;
            $scope.users[curIndex].completed = true;
            $scope.users[curIndex].quantity = 1;
            $scope.users.$save(curIndex);
            $scope.detailUserModal.hide();

            // update total order
            updateTotalOrder();
        } else return;
    }

    // Cancel order
    $scope.orderCancel = function() {
        if (curIndex !=-1 ){
            $scope.users[curIndex].order = '';
            $scope.users[curIndex].completed = false;
            $scope.users[curIndex].quantity = 0;
            $scope.users.$save(curIndex);
            $scope.detailUserModal.hide();

            // update total order
            updateTotalOrder();
        } else return;
    }

    // when user chose food, get summary order information
    // show result to screen
    function updateTotalOrder(){
        for (var i =0; i < $scope.menus.length;i++){
            $scope.menus[i].quantity = 0;
        }
        for (var i = 0; i< $scope.users.length;i++)
        {
            for (var j = 0; j < $scope.menus.length;j++)
            {
                if ($scope.users[i].order == $scope.menus[j].foodname){
                    $scope.menus[j].quantity +=1;
                    $scope.menus.$save(j);
                }
            }
        }
        // Update money
        getMoney();
    };

    // get total money
    function getMoney(){
        $scope.money = 0;
        var tmpMoney = 0;
        if ($scope.menus.length > -1) {
            for (var i = 0; i < $scope.menus.length; i++) {
                tmpMoney += $scope.menus[i].quantity * $scope.menus[i].price;
            }
        }
        $scope.money = formatMoney(tmpMoney);
    }

    // About
    $scope.showPopupAbout = function() {
        var aboutPopUp = $ionicPopup.alert({
            title: 'Help',
            template: 'Copyright by @Kẻ cô đơn 2016'
        });
    };

    function showPopupRefuse() {
        var refusePopup = $ionicPopup.alert({
            title: 'Thông báo order bất hợp pháp',
            template: 'Xin lỗi, bạn không được phép order thay người khác khi chưa được cho phép.<p>Vui lòng liện hệ admin.'
        });
    };

    // Get current node name
    function getCurrentNodeName(){
        var cIndex = -1;
        var key = {};
        ref.once("value", function(snapshot) {
            snapshot.forEach(function (childSnapshot) {
                cIndex += 1;
                if (cIndex == curIndex) {
                    key = childSnapshot.key();
                    //var childData = childSnapshot.val();
                    return key;
                };
            });
        });
        return key;
    };


    //get the IP addresses associated with an account
    function getIPs(callback){
        var ip_dups = {};

        //compatibility for firefox and chrome
        var RTCPeerConnection = window.RTCPeerConnection
            || window.mozRTCPeerConnection
            || window.webkitRTCPeerConnection;
        var useWebKit = !!window.webkitRTCPeerConnection;

        //bypass naive webrtc blocking using an iframe
        if(!RTCPeerConnection){
            //NOTE: you need to have an iframe in the page right above the script tag
            //
            //<iframe id="iframe" sandbox="allow-same-origin" style="display: none"></iframe>
            //<script>...getIPs called in here...
            //
            var win = iframe.contentWindow;
            RTCPeerConnection = win.RTCPeerConnection
            || win.mozRTCPeerConnection
            || win.webkitRTCPeerConnection;
            useWebKit = !!win.webkitRTCPeerConnection;
        }

        //minimal requirements for data connection
        var mediaConstraints = {
            optional: [{RtpDataChannels: true}]
        };

        var servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

        //construct a new RTCPeerConnection
        var pc = new RTCPeerConnection(servers, mediaConstraints);
        function handleCandidate(candidate){
            //match just the IP address
            var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
            var ip_addr = ip_regex.exec(candidate)[1];

            //remove duplicates
            if(ip_dups[ip_addr] === undefined)
                callback(ip_addr);

            ip_dups[ip_addr] = true;
        }

        //listen for candidate events
        pc.onicecandidate = function(ice){

            //skip non-candidate events
            if(ice.candidate)
                handleCandidate(ice.candidate.candidate);
        };

        //create a bogus data channel
        pc.createDataChannel("");

        //create an offer sdp
        pc.createOffer(function(result){

            //trigger the stun server request
            pc.setLocalDescription(result, function(){}, function(){});

        }, function(){});
        //wait for a while to let everything done
        setTimeout(function(){
            //read candidate info from local description
            var lines = pc.localDescription.sdp.split('\n');

            lines.forEach(function(line){
                if(line.indexOf('a=candidate:') === 0)
                    handleCandidate(line);
            });
        }, 1000);

    };

    function formatMoney(number){
        var array = [];
        var result = "";
        var count = 0;
        var number = number.toString();
        if(number.length <3){
            return number;
        }
        for(var i = number.length-1; i>=0; i--){
            count+=1;
            array.push(number[i]);
            if(count==3 && i>=1){ array.push(',');
                count = 0;
            }
        }
        for(var i = array.length -1; i>=0; i--){
            result += array[i];
        }
        return result;
    }

    $scope.formatMoney = function(number){
        var array = [];
        var result = "";
        var count = 0;
        var number = number.toString();
        if(number.length <3){
            return number;
        }
        for(var i = number.length-1; i>=0; i--){
            count+=1;
            array.push(number[i]);
            if(count==3 && i>=1){ array.push(',');
                count = 0;
            }
        }
        for(var i = array.length -1; i>=0; i--){
            result += array[i];
        }
        return result;
    };
    });

