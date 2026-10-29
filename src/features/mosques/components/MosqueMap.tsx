import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MapPinOff } from 'lucide-react-native';
import { useAppTheme } from '../../../core/theme/ThemeProvider';
import { tints } from '../../../core/theme/palettes';
import { AppConfig } from '../../../core/config/AppConfig';
import type { LivePosition } from '../hooks/useLiveLocation';

export interface MapMosque {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  saved?: boolean;
}

export type MapCommand =
  | { type: 'fitAll' }
  | { type: 'focus'; id: string }
  | { type: 'fitRoute' }
  | { type: 'recenter' };

export interface MosqueMapHandle {
  run: (cmd: MapCommand) => void;
}

interface Props {
  user: LivePosition;
  mosques: MapMosque[];
  selectedId: string | null;
  route: [number, number][] | null;
  /** Dashed line for walking routes */
  dashedRoute?: boolean;
  /** Keep the camera on the user as they move (tracker mode) */
  follow?: boolean;
  /** Space (px) covered by floating UI, so fitted markers aren't hidden behind it */
  padding: { top: number; bottom: number };
  onSelect: (id: string) => void;
  /** User dragged the map (used to stop following) */
  onUserPan?: () => void;
}

/**
 * Interactive OpenStreetMap (Leaflet in a WebView): no API key and no native map SDK needed.
 * Data flows in through `setData`, camera moves through `run`, taps come back via postMessage.
 */
export const MosqueMap = forwardRef<MosqueMapHandle, Props>(function MosqueMapImpl(props, ref) {
  const { colors } = useAppTheme();
  const webRef = useRef<WebView<{}>>(null);
  const ready = useRef(false);
  const [failed, setFailed] = useState(false);
  const { onSelect, onUserPan } = props;

  const data = useMemo(() => JSON.stringify({
    user: props.user,
    mosques: props.mosques,
    selectedId: props.selectedId,
    route: props.route,
    dashed: !!props.dashedRoute,
    follow: !!props.follow,
    padding: props.padding,
  }), [props.user, props.mosques, props.selectedId, props.route, props.dashedRoute, props.follow, props.padding]);

  const inject = useCallback((js: string) => {
    if (ready.current) webRef.current?.injectJavaScript(`try{${js}}catch(e){};true;`);
  }, []);

  useEffect(() => { inject(`window.ummati.setData(${data});`); }, [data, inject]);

  useImperativeHandle(ref, () => ({
    run: (cmd) => inject(`window.ummati.run(${JSON.stringify(cmd)});`),
  }), [inject]);

  const onMessage = useCallback((e: WebViewMessageEvent) => {
    let msg: any;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg.type === 'ready') {
      ready.current = true;
      setFailed(false);
      inject(`window.ummati.setData(${data});window.ummati.run({type:'fitAll'});`);
    } else if (msg.type === 'select') {
      onSelect(msg.id);
    } else if (msg.type === 'pan') {
      onUserPan?.();
    } else if (msg.type === 'error') {
      setFailed(true);
    }
  }, [data, inject, onSelect, onUserPan]);

  // The page is built once per theme; everything else is pushed in with setData
  const html = useMemo(() => buildHtml({
    dark: colors.isDark,
    ink: colors.ink,
    primary: colors.primary,
    accent: colors.accent,
    surface: colors.surface,
    text: colors.text,
    saved: tints.rose,
  }), [colors.isDark, colors.ink, colors.primary, colors.accent, colors.surface, colors.text]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView<{}>
        ref={webRef}
        source={{ html, baseUrl: 'https://com.ummati' }}
        originWhitelist={['*']}
        onMessage={onMessage}
        onLoadStart={() => { ready.current = false; }}
        onError={() => setFailed(true)}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        overScrollMode="never"
        bounces={false}
        style={{ backgroundColor: colors.isDark ? '#262626' : '#F2EFE9' }}
      />
      {failed ? (
        <View style={[styles.failed, { backgroundColor: colors.background }]} pointerEvents="none">
          <MapPinOff color={colors.textMuted} size={34} />
          <Text style={[styles.failedTitle, { color: colors.text }]}>Map needs internet</Text>
          <Text style={[styles.failedText, { color: colors.textSecondary }]}>Connect to load the map. Saved results still show below.</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  failed: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 32 },
  failedTitle: { fontSize: 17, fontWeight: '900' },
  failedText: { fontSize: 13, textAlign: 'center' },
});

function buildHtml(t: { dark: boolean; ink: string; primary: string; accent: string; surface: string; text: string; saved: string }) {
  const keyParam = AppConfig.cartoApiKey ? `?key=${AppConfig.cartoApiKey}` : '';
  const tiles = t.dark
    ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${keyParam}`
    : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyParam}`;
  // Ink outline on dark tiles needs to stand out, so use the light surface colour instead
  const outline = t.dark ? '#FFFAF1' : t.ink;
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:${t.dark ? '#262626' : '#F2EFE9'};}
  .leaflet-container{font-family:-apple-system,Roboto,sans-serif;}
  .leaflet-control-attribution{font-size:9px;background:rgba(255,255,255,.75)!important;border-radius:6px 0 0 0;}
  .leaflet-bottom{transition:bottom .25s;}
  .pin{position:relative;width:38px;height:46px;transition:transform .18s ease;transform-origin:50% 100%;}
  .pin .face{position:absolute;left:0;top:0;width:34px;height:34px;border-radius:12px;background:${t.primary};
    border:2.5px solid ${outline};box-shadow:3px 3px 0 ${outline};display:flex;align-items:center;justify-content:center;box-sizing:border-box;}
  .pin .tail{position:absolute;left:12px;top:30px;width:10px;height:10px;background:${t.primary};
    border-right:2.5px solid ${outline};border-bottom:2.5px solid ${outline};transform:rotate(45deg);}
  .pin.saved .face,.pin.saved .tail{background:${t.saved};}
  .pin.sel{transform:scale(1.32);z-index:1000!important;}
  .pin.sel .face,.pin.sel .tail{background:${t.accent};}
  .pin svg{width:20px;height:20px;}
  .label{position:absolute;left:50%;top:48px;transform:translateX(-50%);white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;
    background:${t.surface};color:${t.text};border:2px solid ${outline};border-radius:9px;padding:2px 7px;font-size:10px;font-weight:800;box-shadow:2px 2px 0 ${outline};}
  .me{position:relative;width:22px;height:22px;}
  .me .dot{position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-sizing:border-box;box-shadow:0 0 0 2px ${t.ink};}
  .me .ring{position:absolute;left:-9px;top:-9px;width:40px;height:40px;border-radius:50%;background:rgba(59,130,246,.35);animation:pulse 1.8s ease-out infinite;}
  .me .cone{position:absolute;left:1px;top:-16px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;
    border-bottom:22px solid rgba(59,130,246,.45);transform-origin:50% 27px;display:none;}
  @keyframes pulse{0%{transform:scale(.4);opacity:.9}100%{transform:scale(1.5);opacity:0}}
</style></head>
<body><div id="map"></div>
<script>
(function(){
  function post(m){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(m));}
  if(!window.L){post({type:'error'});return;}
  var map=L.map('map',{zoomControl:false,attributionControl:true}).setView([21.4225,39.8262],14);
  L.tileLayer('${tiles}',{maxZoom:19,subdomains:'abcd',attribution:'&copy; OpenStreetMap &copy; CARTO'}).addTo(map);
  map.attributionControl.setPrefix(false);

  var ICON='<svg viewBox="0 0 24 24" fill="${t.ink}"><path d="M12 2.5c-.4 1.4-3.6 3.2-3.6 6V10h7.2V8.5c0-2.8-3.2-4.6-3.6-6z"/><path d="M4 21v-9.5h1V8l1-1.5L7 8v3.5h10V8l1-1.5L19 8v3.5h1V21h-5.5v-3.5a2.5 2.5 0 0 0-5 0V21z"/></svg>';
  var state={mosques:[],selectedId:null,follow:false,padding:{top:0,bottom:0}};
  var markers={};
  var mosqueKey='';
  var routeCasing=null,routeLine=null;
  var me=null,acc=null;
  var programmatic=false;

  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function pinIcon(m,sel){
    return L.divIcon({className:'',iconSize:[38,46],iconAnchor:[17,42],
      html:'<div class="pin'+(sel?' sel':'')+(m.saved?' saved':'')+'"><div class="tail"></div><div class="face">'+ICON+'</div>'+(sel?'<div class="label">'+esc(m.name)+'</div>':'')+'</div>'});
  }
  function pad(){return {paddingTopLeft:[40,state.padding.top+30],paddingBottomRight:[40,state.padding.bottom+30]};}
  function move(fn){programmatic=true;fn();setTimeout(function(){programmatic=false;},700);}

  map.on('dragstart',function(){if(!programmatic)post({type:'pan'});});

  window.ummati={
    setData:function(d){
      var prevSel=state.selectedId;
      state=d;
      document.querySelector('.leaflet-bottom.leaflet-right').style.bottom=(d.padding.bottom-4)+'px';

      // user
      var ll=[d.user.latitude,d.user.longitude];
      if(!me){
        me=L.marker(ll,{interactive:false,zIndexOffset:2000,icon:L.divIcon({className:'',iconSize:[22,22],iconAnchor:[11,11],
          html:'<div class="me"><div class="ring"></div><div class="cone"></div><div class="dot"></div></div>'})}).addTo(map);
        acc=L.circle(ll,{radius:d.user.accuracy||0,color:'#3B82F6',weight:1,fillOpacity:.08,interactive:false}).addTo(map);
      }else{me.setLatLng(ll);acc.setLatLng(ll);acc.setRadius(d.user.accuracy||0);}
      var cone=me.getElement()&&me.getElement().querySelector('.cone');
      if(cone){var h=d.user.heading;cone.style.display=(h!=null&&h>=0)?'block':'none';cone.style.transform='rotate('+(h||0)+'deg)';}

      // mosques: rebuild only when the set changes, otherwise just restyle the selection
      var key=d.mosques.map(function(m){return m.id+(m.saved?'*':'');}).join(',');
      if(key!==mosqueKey){
        Object.keys(markers).forEach(function(id){map.removeLayer(markers[id]);});
        markers={};
        d.mosques.forEach(function(m){
          var mk=L.marker([m.latitude,m.longitude],{icon:pinIcon(m,m.id===d.selectedId),zIndexOffset:m.id===d.selectedId?1000:0});
          mk.on('click',function(){post({type:'select',id:m.id});});
          mk.addTo(map);markers[m.id]=mk;
        });
        mosqueKey=key;
      }else if(prevSel!==d.selectedId){
        d.mosques.forEach(function(m){
          if(m.id===prevSel||m.id===d.selectedId){
            markers[m.id].setIcon(pinIcon(m,m.id===d.selectedId));
            markers[m.id].setZIndexOffset(m.id===d.selectedId?1000:0);
          }
        });
      }

      // route: thick ink casing under a coloured line, like the app's outlined cards
      if(routeCasing){map.removeLayer(routeCasing);map.removeLayer(routeLine);routeCasing=routeLine=null;}
      if(d.route&&d.route.length>1){
        routeCasing=L.polyline(d.route,{color:'${outline}',weight:10,opacity:1,lineCap:'round',lineJoin:'round',interactive:false}).addTo(map);
        routeLine=L.polyline(d.route,{color:'${t.primary}',weight:6,opacity:1,dashArray:d.dashed?'1 11':null,lineCap:'round',lineJoin:'round',interactive:false}).addTo(map);
        me.setZIndexOffset(3000);
      }

      if(d.follow)move(function(){map.panTo(ll,{animate:true});});
    },
    run:function(c){
      var u=[state.user.latitude,state.user.longitude];
      if(c.type==='recenter'){move(function(){map.flyTo(u,Math.max(map.getZoom(),16),{duration:.6});});}
      else if(c.type==='focus'){
        var m=markers[c.id];if(!m)return;
        var b=L.latLngBounds([m.getLatLng(),u]);
        // Close by: frame both you and the masjid. Far away: just go to the masjid.
        if(m.getLatLng().distanceTo(u)<3000)move(function(){map.flyToBounds(b,Object.assign({maxZoom:17,duration:.6},pad()));});
        else move(function(){map.flyTo(m.getLatLng(),15,{duration:.6});});
      }
      else if(c.type==='fitRoute'&&routeCasing){move(function(){map.flyToBounds(routeCasing.getBounds(),Object.assign({maxZoom:17,duration:.7},pad()));});}
      else if(c.type==='fitAll'){
        var pts=[u];
        // nearest few masjids give a useful first view; all of them would zoom out too far
        state.mosques.slice(0,8).forEach(function(m){pts.push([m.latitude,m.longitude]);});
        if(pts.length===1)move(function(){map.setView(u,15);});
        else move(function(){map.fitBounds(L.latLngBounds(pts),Object.assign({maxZoom:16},pad()));});
      }
    }
  };
  post({type:'ready'});
})();
</script></body></html>`;
}
