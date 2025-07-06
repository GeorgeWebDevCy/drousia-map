import json, math, sys

# Haversine distance in meters between two (lat, lon) points
R = 6371000

def haversine(a, b):
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 2 * R * math.asin(math.sqrt(h))

# Distance from point to line segment defined by two points

def dist_to_segment(p, a, b):
    # convert to radians for planar projection
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    latp, lonp = map(math.radians, p)
    # approximate using 2D projection
    ax, ay = lon1, lat1
    bx, by = lon2, lat2
    px, py = lonp, latp
    lx = bx - ax
    ly = by - ay
    if lx == ly == 0:
        t = 0
    else:
        t = ((px-ax)*lx + (py-ay)*ly) / (lx*lx + ly*ly)
        t = max(0, min(1, t))
    projx = ax + t*lx
    projy = ay + t*ly
    # convert back to degrees
    proj = (math.degrees(projy), math.degrees(projx))
    return haversine(p, proj)

if __name__ == '__main__':
    data = json.load(open('data/locations.json'))
    targets = ['Βολατζιές', 'Οικισμός Πιττοκόπος']
    for i, loc in enumerate(data):
        if loc['title'] in targets:
            if 0 < i < len(data)-1:
                prev = (data[i-1]['lat'], data[i-1]['lng'])
                next = (data[i+1]['lat'], data[i+1]['lng'])
                p = (loc['lat'], loc['lng'])
                d = dist_to_segment(p, prev, next)
                print(loc['title'], 'distance to road:', round(d,2), 'm')
            else:
                print(loc['title'], 'no neighbors')
