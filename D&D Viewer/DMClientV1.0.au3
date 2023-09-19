#include <GUIConstantsEx.au3>
#include <GDIPlus.au3>
#include <WinAPI.au3>
#include <Misc.au3>
#include <Array.au3>
#include <WindowsConstants.au3>
#include <StaticConstants.au3>

Global $Password = "Yeet"

Opt("MouseCoordMode", 2)

if FileExists("Instellingen.conf") Then
   $ConfData = FileReadToArray("Instellingen.conf")
   if UBound($ConfData)<>10 Then
	  MsgBox(64, "Map Viewer", "Configuration file may be incorrect, restoring default config")
	  InitialSetup()
   Else
	  Global $WindowSize[2] = [$ConfData[1], $ConfData[1]]
	  Global $ViewPort[2] = [$ConfData[3], $ConfData[3]]
	  Global $GridlineWidth = $ConfData[5]
	  Global $BackgroundColor = $ConfData[7]
	  Global $GridColor = $ConfData[9]
   EndIf
Else
   InitialSetup()
EndIf

Func InitialSetup()
   $Conf = FileOpen("Instellingen.conf", 2)
   FileWrite($Conf, "#Square window size:"&@CRLF&"900"&@CRLF&"#Default Zoom"&@CRLF&"16"&@CRLF&"#Grid line width"&@CRLF&"1.5"&@CRLF&"#Background Color"&@CRLF&"0xFF000000"&@CRLF&"#Grid line Color"&@CRLF&"0xFF000000")
   Global $WindowSize[2] = [@DesktopHeight*0.80, @DesktopHeight*0.80]
   Global $ViewPort[2] = [16, 16]
   Global $GridlineWidth = 1.5
   Global $BackgroundColor = 0xFF000000
   Global $GridColor = 0xFF000000
EndFunc

Global $GridEnabled = True
Global $TileSize[2]
Global $ViewportPos[2] = [0, 0]
Global $Tokens[0]
Global $MapImage

$PreviousToken=""

TCPStartup()
$IP = InputBox("Map Viewer Client", "Please enter IP to connect to:", "217.103.175.149")
$Port = InputBox("Map Viewer Client", "Please enter port number", "6969")
if $Port = "" Or $IP = "" Then
   Exit
EndIf
$Socket = TCPConnect($IP, $Port)

$Data = ""
Do
   $Data = TCPRecv($Socket, 999)
Until $Data <> ""
Local $SetupArr = StringSplit($Data, "*")
_ArrayDelete($SetupArr, 0)
$X = $SetupArr[0]
$Y = $SetupArr[1]
$map = @ScriptDir&$SetupArr[2]

GUIRegisterMsg($WM_MOUSEWHEEL, "WheelScroll")
Global $MapView = GUICreate("Map Viewer", $WindowSize[0], $WindowSize[1]+20, 1, 1)
GUISetBkColor($BackgroundColor, $MapView)

Global $ImageSize = GetImageDimensions($map)
$MapImage = GUICtrlCreatePic($map, 0,0,$ImageSize[0],$ImageSize[1])
$HelpMenu = GUICtrlCreateMenu("Help", -1, 1)
$ControlsMenu = GUICtrlCreateMenuItem("Controls", $HelpMenu)
$DMMenu = GUICtrlCreateMenu("DM", -1, 1)
$LoadMapMenu = GUICtrlCreateMenuItem("Load new map", $DMMenu)
GUISetState(@SW_SHOW)
BuildTokensArray($SetupArr[3])
DrawMap()

$HotkeysSet = False
While 1
   if not WinActive($MapView) And $HotkeysSet = True Then
	  HotKeySet("{DOWN}")
	  HotKeySet("{UP}")
	  HotKeySet("{LEFT}")
	  HotKeySet("{RIGHT}")
	  HotKeySet("s")
	  HotKeySet("w")
	  HotKeySet("a")
	  HotKeySet("d")
	  HotKeySet("t")
	  HotKeySet("r")
	  HotKeySet("g")
	  HotKeySet("^=")
	  HotKeySet("^-")
	  HotKeySet("^0")
	  $HotkeysSet = False
   elseif WinActive($MapView) And $HotkeysSet = False Then
	  HotKeySet("{DOWN}", "MovePort")
	  HotKeySet("{UP}", "MovePort")
	  HotKeySet("{LEFT}", "MovePort")
	  HotKeySet("{RIGHT}", "MovePort")
	  HotKeySet("s", "MovePort")
	  HotKeySet("w", "MovePort")
	  HotKeySet("a", "MovePort")
	  HotKeySet("d", "MovePort")
	  HotKeySet("t", "PlaceToken")
	  HotKeySet("r", "RemoveToken")
	  HotKeySet("g", "ToggleGrid")
	  HotKeySet("^=", "ZoomIn")
	  HotKeySet("^-", "ZoomOut")
	  HotKeySet("^0", "ZoomReset")
	  $HotkeysSet = True
   EndIf
   $nMsg = GUIGetMsg()
   Switch $nMsg
	  Case $GUI_EVENT_CLOSE
		 Exit
	  Case $GUI_EVENT_RESTORE
		 DrawTokens()
		 DrawMap()
	  Case $GUI_EVENT_PRIMARYDOWN
		 MoveToken()
	  Case $ControlsMenu
		 MsgBox(64, "Map Viewer", "Pan map: WASD or Arrow keys"&@CRLF&"Move token: Mouse drag"&@CRLF&"Place token: T"&@CRLF&"Remove token: R"&@CRLF&"Toggle grid: G"&@CRLF&@CRLF&"Zoom in: Ctrl= | Scroll wheel up"&@CRLF&"Zoom out: Ctrl- | Scroll wheel down"&@CRLF&"Zoom reset: Ctrl0")
	  Case $LoadMapMenu
		 ChangeMap()
   EndSwitch

   Local $Data = TCPRecv($Socket, 999)
   if $Data <> "" Then
	  ConsoleWrite("Command Recieved: ")
	  $CommandData = StringSplit($Data, "|")
	  $Command = $CommandData[1]
	  Switch ($Command)
		 Case "m"
			$OldPos = StringSplit($CommandData[2], ":")
			$NewPos = StringSplit($CommandData[3], ":")
			Local $i = 0
			Do
			   Local $TokenArr = $Tokens[$i]
			   if ($TokenArr[0]=$OldPos[1] And $TokenArr[1]=$OldPos[2]) Then
				  ConsoleWrite("Moving token from "&$OldPos[1]&":"&$OldPos[2]&" to "&$NewPos[1]&":"&$NewPos[2]&@CRLF)
				  $TokenArr[0] = $NewPos[1]
				  $TokenArr[1] = $NewPos[2]
				  $Tokens[$i] = $TokenArr
				  DrawMap()
				  ExitLoop
			   EndIf
			   $i += 1
			Until $i >= UBound($Tokens)
		 Case "r"
			$Pos = StringSplit($CommandData[2], ":")
			ConsoleWrite("Remove token at: "&$Pos[1]&":"&$Pos[2]&@CRLF)
			For $i = 0 to UBound($Tokens)-1 Step 1
			   Local $Token = $Tokens[$i]
			   if $Token[0] = $Pos[1] And $Token[1] = $Pos[2] Then
				  _ArrayDelete($Tokens, $i)
				  ExitLoop
			   EndIf
			Next
			DrawMap()
		 Case "a"
			$Pos = StringSplit($CommandData[2], ":")
			ConsoleWrite("Added token at: "&$Pos[1]&":"&$Pos[2]&@CRLF)
			Local $tmpToken = [$Pos[1], $Pos[2], $CommandData[3], $CommandData[4]]
			_ArrayAdd($Tokens, Null)
			$Tokens[UBound($Tokens)-1]=$tmpToken
			DrawMap()
		 Case "u"
			For $t in $Tokens
			   _ArrayDelete($Tokens, 0)
			Next
			LoadNewMap($CommandData[2])
	  EndSwitch
   EndIf
WEnd

;Admin Section
Func ChangeMap()
   Do
	  $map = FileOpenDialog("Choose map to display", @ScriptDir&"\maps\", "JPG/JPEG(*.jpg)", 1)
   Until $map <> ""
   Local $SplitMapPath = StringSplit($map, "\maps\", 1)
   $map = "\maps\" & $SplitMapPath[2]
   $X = InputBox("Map Viewer", "Please enter X dimension of desired/existing grid")
   $Y = InputBox("Map Viewer", "Please enter Y dimension of desired/existing grid")
   $RemoveTokens = MsgBox(68, "Map Viewer", "Remove existing tokens?")
   ConsoleWrite($RemoveTokens&@CRLF)
   ConsoleWrite("Map Change command Sent"&@CRLF)
   TCPSend($Socket, "u|"&$Password&"|"&$RemoveTokens&"|"&$X&"*"&$Y&"*"&$map)
EndFunc

;End of Admin Section

Func LoadNewMap($Data)
   GUISetState(@SW_HIDE, $MapImage)
   Local $SetupArr = StringSplit($Data, "*")
   _ArrayDelete($SetupArr, 0)
   $X = $SetupArr[0]
   $Y = $SetupArr[1]
   $map = @ScriptDir&$SetupArr[2]
   $ImageSize = GetImageDimensions($map)
   ControlMove($MapView, "", $MapImage, 0, 0, $ImageSize[0], $ImageSize[1])
   GUICtrlSetImage($MapImage, $map)
   GUISetState(@SW_SHOW, $MapImage)
   $ViewportPos[0] = 0
   $ViewportPos[1] = 0
   if UBound($SetupArr)>=4 Then
	  BuildTokensArray($SetupArr[3])
   EndIf
   DrawMap()
EndFunc

Func CheckTokenPos($Token, $x, $y)
   if $x-$Token[0] >= 0 And $x-$Token[0] <= $Token[3] Then
	  if $y-$Token[1] >= 0 And $y-$Token[1] <= $Token[3] Then
		 Local $Offset[] = [$x-$Token[0], $y-$Token[1]]
		 Return $Offset
	  EndIf
   EndIf
   Return False
EndFunc

Func BuildTokensArray($Data)
   Local $BuildArray[] = []
   Local $TempArr = StringSplit($Data, ";")
   For $i = 1 to UBound($TempArr)-1 step 1
	  $Part = StringSplit($TempArr[$i], ":")
	  _ArrayDelete($Part, 0)
	  $TempArr[$i] = $Part
   Next
   _ArrayDelete($TempArr, 0)
   Local $t = $TempArr[0]
   if $t[0] <> "" Then
	  $Tokens = $TempArr
   EndIf
EndFunc

Func MoveToken()
   Local $Tile = GetMouseTile()
   Local $SelectedToken = Null
   Local $Offset = False
   if UBound($Tokens)>0 Then
	  $iMax = UBound($Tokens)-1
	  For $i = 0 To $iMax Step 1
		 $TokenArr = $Tokens[$i]
		 Local $TempOffset = CheckTokenPos($TokenArr, $Tile[0], $Tile[1])
		 if not ($TempOffset = False) Then
			$Offset = $TempOffset
			$SelectedToken = $i
			GUISetCursor(0, 1, $MapView)
		 EndIf
	  Next
	  if $SelectedToken<>Null Then
		 Do
			$cInfo = GUIGetCursorInfo($MapView)
		 Until Not $cInfo[2]
		 $Tile = GetMouseTile()
		 $Tile[0] -= $Offset[0]
		 $Tile[1] -= $Offset[1]
		 Local $TempArr = $Tokens[$SelectedToken]
		 if ($Tile[0]>=0 And $Tile[0]+$TempArr[3]-1<$X And $Tile[1]>=0 And $Tile[1]+$TempArr[3]-1<$Y) Then
			if Not ($Tile[0]=$TempArr[0] And $Tile[1]=$TempArr[1]) Then
			   ConsoleWrite("Sent Movement command"&@CRLF)
			   TCPSend($Socket, "m|"&$TempArr[0]&":"&$TempArr[1]&"|"&$Tile[0]&":"&$Tile[1])
			EndIf
		 EndIf
		 GUISetCursor(2, 1, $MapView)
	  EndIf
   EndIf
EndFunc

Func GetImageDimensions($map)
   _GDIPlus_Startup()
   Local $Image = _GDIPlus_ImageLoadFromFile($map)
   Local $IS = _GDIPlus_ImageGetDimension($Image)
   _GDIPlus_ImageDispose($Image)
   _GDIPlus_Shutdown()
   return $IS
EndFunc

Func DrawMap()
   $TileSize[0] = $WindowSize[0]/$ViewPort[0]
   $TileSize[1] = $WindowSize[1]/$ViewPort[1]
   $RatioX = $TileSize[0]/($ImageSize[0]/$X)
   $RatioY = $TileSize[1]/($ImageSize[1]/$Y)
   ControlMove($MapView, "", $MapImage, -$ViewportPos[0]*$TileSize[0], -$ViewportPos[1]*$TileSize[1], $ImageSize[0]*$RatioX, $ImageSize[1]*$RatioY)
   _WinAPI_RedrawWindow ($MapView)
   GUISetState(@SW_SHOW)
   Sleep(30)
   if $GridEnabled Then
	  DrawGrid()
   EndIf
   if UBound($Tokens) > 0 Then
	  DrawTokens()
   EndIf
EndFunc

Func ToggleGrid()
   $GridEnabled=Not $GridEnabled
   DrawMap()
EndFunc

Func DrawGrid()
   Local $hGraphic, $hPen
   _GDIPlus_Startup ()
   $hGraphic = _GDIPlus_GraphicsCreateFromHWND ($MapView)
   $hPen = _GDIPlus_PenCreate ($GridColor, $GridlineWidth)

   Local $x = $TileSize[0]
   Do
	  _GDIPlus_GraphicsDrawLine ($hGraphic, $x, 0, $x, $WindowSize[1], $hPen)
	  $x += $TileSize[0]
   Until $x >= $WindowSize[0]

   Local $y = $TileSize[1]
   Do
	  _GDIPlus_GraphicsDrawLine ($hGraphic, 0, $y, $WindowSize[0], $y, $hPen)
	  $y += $TileSize[1]
   Until $y >= $WindowSize[1]
   _GDIPlus_PenDispose ($hPen)
   _GDIPlus_GraphicsDispose ($hGraphic)
   _GDIPlus_ShutDown ()
EndFunc

Func GetMouseTile()
   local $MousePos = MouseGetPos()
   local $TrueMousePos[2] = [Floor($MousePos[0]/$TileSize[0])+$ViewportPos[0], Floor($MousePos[1]/$TileSize[1])+$ViewportPos[1]]
   Return $TrueMousePos
EndFunc

Func PlaceToken()
   Local $Tile = GetMouseTile()
   Local $TokenPath = FileOpenDialog($MapView, @ScriptDir&"\tokens\", "PNG(*.png)|JPG/JPEG(*.jpg)|All(*.*)", 1, $PreviousToken)
   if $TokenPath <> "" Then
	  $TokenPath = "\tokens\"&StringSplit($TokenPath, "\tokens\", 1)[2]
	  $PreviousToken=$TokenPath
	  Local $Size = InputBox($MapView, "Please enter the size of the token (Max 7):", "1")
	  While $Size>7
		 $Size = InputBox($MapView, "Please enter a smaller size for the token (Max 7):", "1")
	  WEnd
	  If $Size="" or $TokenPath="" or $Size=Null or $TokenPath=Null Then
		 Return
	  EndIf
	  TCPSend($Socket, "a|"&$Tile[0]&":"&$Tile[1]&"|"&$TokenPath&"|"&$Size)
   EndIf
EndFunc

Func RemoveToken()
   Local $Tile = GetMouseTile()
   For $i = 0 to UBound($Tokens)-1 Step 1
	  Local $TokenArr = $Tokens[$i]
	  Local $TempOffset = CheckTokenPos($TokenArr, $Tile[0], $Tile[1])
	  if not ($TempOffset = False) Then
		 $Tile[0] = $Tile[0] - $TempOffset[0]
		 $Tile[1] = $Tile[1] - $TempOffset[1]
		 TCPSend($Socket, "r|"&$Tile[0]&":"&$Tile[1])
	  EndIf
   Next
EndFunc

Func DrawTokens()
   _GDIPlus_Startup()
   local $Graphic = _GDIPlus_GraphicsCreateFromHWND($MapView)
   if UBound($Tokens)<>0 Then
	  For $i = 0 to UBound($Tokens) -1 Step 1
		 Local $TokenArr = $Tokens[$i]
		 local $TokenImage = _GDIPlus_ImageLoadFromFile(@ScriptDir&$TokenArr[2])
		 _GDIPlus_GraphicsDrawImageRect($Graphic,$TokenImage,($TokenArr[0]-$ViewportPos[0])*$TileSize[0], ($TokenArr[1]-$ViewportPos[1])*$TileSize[1], $TileSize[0]*$TokenArr[3], $TileSize[1]*$TokenArr[3])
	  Next
   EndIf
   _GDIPlus_Shutdown()
EndFunc

Func MovePort()
   Switch(@HotKeyPressed)
	  Case "{UP}"
		 if ($ViewportPos[1]>-1) Then
			$ViewportPos[1]-=1
			DrawMap()
		 EndIf
	  Case "{DOWN}"
		 if ($ViewportPos[1]<($Y-$ViewPort[0]+1)) Then
			$ViewportPos[1]+=1
			DrawMap()
		 EndIf
	  Case "{RIGHT}"
		 if ($ViewportPos[0]<($X-$ViewPort[1]+1)) Then
			$ViewportPos[0]+=1
			DrawMap()
		 EndIf
	  Case "{LEFT}"
		 if ($ViewportPos[0]>-1) Then
			$ViewportPos[0]-=1
			DrawMap()
		 EndIf
	  Case "w"
		 if ($ViewportPos[1]>-1) Then
			$ViewportPos[1]-=1
			DrawMap()
		 EndIf
	  Case "s"
		 if ($ViewportPos[1]<($Y-$ViewPort[0]+1)) Then
			$ViewportPos[1]+=1
			DrawMap()
		 EndIf
	  Case "d"
		 if ($ViewportPos[0]<($X-$ViewPort[1]+1)) Then
			$ViewportPos[0]+=1
			DrawMap()
		 EndIf
	  Case "a"
		 if ($ViewportPos[0]>-1) Then
			$ViewportPos[0]-=1
			DrawMap()
		 EndIf
   EndSwitch
EndFunc

Func WheelScroll($hWnd, $iMsg, $wParam, $lParam)
   if int($wParam) = 7864320 Then
	  ZoomIn()
   EndIf
   if int($wParam) = 4287102976 Or int($wParam) = -7864320 Then
	  ZoomOut()
   EndIf
EndFunc

Func ZoomIn()
   if ($ViewPort[0] > 1 And $ViewPort[1] > 1) Then
	  $ViewPort[0] -= 1
	  $ViewPort[1] -= 1
	  DrawMap()
   EndIf
EndFunc

Func ZoomOut()
   $ViewPort[0] += 1
   $ViewPort[1] += 1
   DrawMap()
EndFunc

Func ZoomReset()
   $ViewPort[0] = 16
   $ViewPort[1] = 16
   DrawMap()
EndFunc