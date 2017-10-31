<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<html>
<head>
    <title></title>
	<meta charset="UTF-8">
    <meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1">
    <!-- Styles -->
	<link rel="stylesheet" href="https://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.css" />
	<!-- <link href="css/classic.css" rel="stylesheet" type="text/css"/> -->
    <!-- <link href="css/app.css" rel="stylesheet" type="text/css" /> -->
	<link rel="stylesheet" href="css/notation-master.css" />
    <!-- Libraries -->
<!-- 	<script src="js/modernizr-custom.js"></script> -->
    <script type="text/javascript">
    var pageTrebleLow="<%=request.getParameter("trebleLow")%>"
    var pageTrebleHigh="<%=request.getParameter("trebleHigh")%>"
    var pageBassLow="<%=request.getParameter("bassLow")%>"
    var pageBassHigh="<%=request.getParameter("bassHigh")%>"
    </script>
	<script src="https://code.jquery.com/jquery-1.11.1.js"></script>
	<script type="text/javascript" src="https://unpkg.com/vexflow/releases/vexflow-debug.js"></script>
    <!-- <script src="../../lib/jstorage/jstorage.min.js" type="text/javascript"></script> -->
    <!-- App -->
    <script src="js/notation-master/NotationMasterModel.js" type="text/javascript"></script>
    <!-- JQM -->
    <script src="https://code.jquery.com/mobile/1.4.5/jquery.mobile-1.4.5.js" type="text/javascript"></script>
</head>
<body>
    <!-- Notes List Page -->
    <div data-role="page" id="home-page" data-title="Notation Master">
        <div data-role="header" data-position="fixed" data-tap-toggle="false">
            <h1>Music Notation Master</h1>
        </div>
        <div data-role="content" id="home-content">
        	<div class="horizontal-top">
        		<canvas id="home-content-canvas" width=500 height=500></canvas>
        	</div>
		</div>
        <div data-role="footer" data-position="fixed" class="ui-bar" data-tap-toggle="false">
        	© 2016 MFJ Associates
        </div>
    </div>
</body>
</html>
