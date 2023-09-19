#include <GUIConstantsEx.au3>
#include <GDIPlus.au3>
#include <ColorConstants.au3>
#include <WinAPI.au3>
#include <Misc.au3>
#include <Array.au3>
#include <WindowsConstants.au3>

Global $Password = "Yeet"

Opt("MouseCoordMode", 2)
TCPStartup()

do
   $Input = InputBox("Map Viewer Server", "Choose an ip"&@CRLF&"1: 192.168.0.94"&@CRLF&"2: "&@IPAddress2&@CRLF&"3: "&@IPAddress3&@CRLF&"4: "&@IPAddress4&@CRLF&"5: 127.0.0.1"&@CRLF&"6: Custom", "1", "", 250, 250)
   Switch($Input)
	  Case "1"
		 $IP = "192.168.0.94"
	  Case "2"
		 $IP = @IPAddress2
	  Case "3"
		 $IP = @IPAddress3
	  Case "4"
		 $IP = @IPAddress4
	  Case "5"
		 $IP = "127.0.0.1"
	  Case "6"
		 $IP = InputBox("Map Viewer Server", "Enter an IP")
	  Case Else
		 $IP = ""
   EndSwitch
Until $IP <> ""
$Port = InputBox("Map Viewer Server", "Enter a port number", "6969")

Global $Tokens[0]


$map = FileOpenDialog("Choose map to display", @ScriptDir&"\maps\", "JPG/JPEG(*.jpg)", 1)
$X = InputBox("Map Viewer", "Please enter X dimension of desired/existing grid")
$Y = InputBox("Map Viewer", "Please enter Y dimension of desired/existing grid")
If $map = "" or $X = "" or $Y = "" Then
   Exit
EndIf
Local $SplitMapPath = StringSplit($map, "\maps\", 1)
$map = "\maps\" & $SplitMapPath[2]

Global $SocketArr[0]
$Listener = TCPListen($IP, $Port)
ConsoleWrite("Listening on: "&$IP&" : "&$Port&@CRLF)
While 1
   For $Socket in $SocketArr
	  Local $Data = TCPRecv($Socket, 999)
	  if $Data <> "" Then
		 $CommandData = StringSplit($Data, "|")
		 $Command = $CommandData[1]
		 Switch ($Command)
			Case "m"
			   ConsoleWrite("Movement Requested: ")
			   $OldPos = StringSplit($CommandData[2], ":")
			   $NewPos = StringSplit($CommandData[3], ":")
			   For $i = 0 To UBound($Tokens)-1 Step 1
				  Local $TokenArr = $Tokens[$i]
				  if ($TokenArr[0]=$OldPos[1] And $TokenArr[1]=$OldPos[2]) Then
					 ConsoleWrite("Movement Done"&@CRLF)
					 $TokenArr[0] = $NewPos[1]
					 $TokenArr[1] = $NewPos[2]
					 $Tokens[$i] = $TokenArr
					 SendToAll($Data)
					 ExitLoop
				  EndIf
			   Next

			Case "r"
			   SendToAll($Data)
			   ConsoleWrite("Remove Command:"&@CRLF)
			   ConsoleWrite($Data&@CRLF)
			   $Pos = StringSplit($CommandData[2], ":")
			   For $i = 0 to UBound($Tokens) -1 Step 1
				  Local $Token = $Tokens[$i]
				  if $Token[0] = $Pos[1] And $Token[1] = $Pos[2] Then
					 _ArrayDelete($Tokens, $i)
					 ExitLoop
				  EndIf
			   Next

			Case "a"
			   SendToAll($Data)
			   $Pos = StringSplit($CommandData[2], ":")
			   ConsoleWrite("Added token at: "&$Pos[1]&":"&$Pos[2]&@CRLF)
			   Local $tmpToken = [$Pos[1], $Pos[2], $CommandData[3], $CommandData[4]]
			   _ArrayAdd($Tokens, Null)
			   $Tokens[UBound($Tokens)-1]=$tmpToken

			Case "u"
			   if $CommandData[2] = $Password Then
				  Local $MapData = StringSplit($CommandData[4], "*")
				  $X = $MapData[1]
				  $Y = $MapData[2]
				  $map = $MapData[3]
				  if $CommandData[3] = 6 Then
					 For $t in $Tokens
						_ArrayDelete($Tokens, 0)
					 Next
					 ConsoleWrite("u|"&$X&"*"&$Y&"*"&$map)
					 SendToAll("u|"&$X&"*"&$Y&"*"&$map)
				  Elseif $CommandData[3] = 7 Then
					 SendToAll("u|"&$X&"*"&$Y&"*"&$map&"*"&BuildTokensString())
				  EndIf

			   EndIf
		 EndSwitch
	  EndIf
   Next

   $TempSocket = TCPAccept($Listener)
   if $TempSocket <> -1 Then
	  TCPSend($TempSocket, $X&"*"&$Y&"*"&$map&"*"&BuildTokensString())
	  _ArrayAdd($SocketArr, $TempSocket)
	  $TempSocket = Null
	  ConsoleWrite("A device has Connected"&@CRLF)
   EndIf
WEnd

Func BuildTokensString()
   Local $String = ""
   For $Token in $Tokens
	  $mString = ""
	  For $Element in $Token
		 $mString=$mString&String($Element)&":"
	  Next
	  $mString = StringTrimRight($mString, 1)
	  $String=$String&$mString&";"
   Next
   $String = StringTrimRight($String, 1)
   Return $String
EndFunc

Func SendToAll($Data)
   for $Socket in $SocketArr
	  TCPSend($Socket, $Data)
   Next
EndFunc
